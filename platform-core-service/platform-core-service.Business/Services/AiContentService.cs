using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;

namespace platform_core_service.Business.Services
{
    public class AiContentService : IAiContentService
    {
        private const int MinSummaryContentLength = 300;
        private static readonly TimeSpan CompletedSummaryCacheTtl = TimeSpan.FromHours(6);
        private static readonly TimeSpan SummaryLockTtl = TimeSpan.FromSeconds(60);
        private const string CodeExplainVersion = "v2-compact";
        private const string CodeDiagramVersion = "v2-high-level";
        private static readonly TimeSpan CompletedCodeToolCacheTtl = TimeSpan.FromHours(6);
        private static readonly TimeSpan CodeToolLockTtl = TimeSpan.FromSeconds(60);
        private const int CodeExplainHourlyLimit = 20;
        private const int CodeDiagramHourlyLimit = 10;
        private const string CompletedStatus = "Completed";
        private const string GeneratingStatus = "Generating";
        private const string FailedStatus = "Failed";
        private const string RateLimitMessage = "You have reached the AI usage limit. Please try again later.";

        private readonly IAiWorkerClient _aiWorkerClient;
        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly ICacheService _cacheService;
        private readonly IConnectionMultiplexer _redis;

        public AiContentService(
            IAiWorkerClient aiWorkerClient,
            ApplicationDbContext context,
            IUserContext userContext,
            ICacheService cacheService,
            IConnectionMultiplexer redis)
        {
            _aiWorkerClient = aiWorkerClient;
            _context = context;
            _userContext = userContext;
            _cacheService = cacheService;
            _redis = redis;
        }

        public async Task<ReturnResult<AIMetadataResponseDTO>> SuggestMetadataAsync(AIMetadataRequestDTO request)
        {
            var returnResult = new ReturnResult<AIMetadataResponseDTO>();
            try
            {
                returnResult = await _aiWorkerClient.SuggestMetadataAsync(request);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] SuggestMetadataAsync failed: {ex.Message}");
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return returnResult;
        }

        public async Task<ReturnResult<SummarizePostResponseDTO>> SummarizePostAsync(string postId, SummarizePostRequestDTO request)
        {
            var returnResult = new ReturnResult<SummarizePostResponseDTO>();
            try
            {
                var post = await _context.Posts
                    .AsNoTracking()
                    .Where(p => p.Id == postId || p.Slug == postId)
                    .Select(p => new
                    {
                        p.Id,
                        p.Title,
                        p.Content,
                        p.AuthorId,
                        p.ModerationStatus,
                        p.Deleted,
                    })
                    .FirstOrDefaultAsync();

                if (post == null || post.Deleted)
                {
                    returnResult.Message = "Post not found.";
                    return returnResult;
                }

                var canViewModerationState = post.ModerationStatus.IsPubliclyVisible()
                    || post.AuthorId == _userContext.ProfileId
                    || _userContext.IsAdmin
                    || _userContext.IsModerator;

                if (!canViewModerationState)
                {
                    returnResult.Message = "Post not found.";
                    return returnResult;
                }

                var title = post.Title ?? string.Empty;
                var content = post.Content ?? string.Empty;
                if (content.Length < MinSummaryContentLength)
                {
                    returnResult.Message = "Post content is too short to summarize.";
                    return returnResult;
                }

                var language = NormalizeLanguage(request?.Language);
                if (!_redis.IsConnected)
                {
                    DevNexusLogger.Instance.Warn("[AiContentService] Redis is unavailable. Falling back to uncached summary generation.");
                    return await GenerateUncachedSummaryAsync(post.Id, content, language);
                }

                var contentHash = ComputeContentHash(title, content);
                var summaryCacheKey = BuildSummaryCacheKey(post.Id, language, contentHash);
                var lockKey = BuildSummaryLockKey(post.Id, language, contentHash);

                var cachedSummary = await _cacheService.GetCacheAsync<SummarizePostResponseDTO>(summaryCacheKey);
                if (cachedSummary != null)
                {
                    cachedSummary.Cached = true;
                    cachedSummary.Status = CompletedStatus;
                    cachedSummary.Message = null;
                    returnResult.Result = cachedSummary;
                    return returnResult;
                }

                var database = _redis.GetDatabase();
                var lockToken = Guid.NewGuid().ToString("N");
                var ownsLock = await database.StringSetAsync(lockKey, lockToken, SummaryLockTtl, When.NotExists);
                if (!ownsLock)
                {
                    returnResult.Result = new SummarizePostResponseDTO
                    {
                        PostId = post.Id,
                        SummaryPoints = [],
                        Cached = false,
                        Status = GeneratingStatus,
                        Message = "AI summary is being prepared. Please try again shortly.",
                    };
                    return returnResult;
                }

                try
                {
                    var aiRequest = new AISummarizeRequestDTO
                    {
                        Content = content,
                        Language = language,
                    };

                    var aiResult = await _aiWorkerClient.SummarizeContentAsync(aiRequest);
                    if (aiResult?.Result == null ||
                        aiResult.Result.SummaryPoints == null ||
                        aiResult.Result.SummaryPoints.Count == 0)
                    {
                        returnResult.Result = new SummarizePostResponseDTO
                        {
                            PostId = post.Id,
                            SummaryPoints = [],
                            Cached = false,
                            Status = FailedStatus,
                            Message = "AI worker could not generate a summary. Please try again shortly.",
                        };
                        returnResult.Message = aiResult?.Message ?? "AI worker could not generate a summary.";
                        return returnResult;
                    }

                    var completedSummary = new SummarizePostResponseDTO
                    {
                        PostId = post.Id,
                        SummaryPoints = aiResult.Result.SummaryPoints,
                        OriginalEstimatedReadTimeSeconds = aiResult.Result.EstimatedReadTimeSeconds,
                        SummaryEstimatedReadTimeSeconds = 60,
                        Cached = false,
                        Status = CompletedStatus,
                        GeneratedAt = DateTimeOffset.UtcNow,
                    };

                    await _cacheService.SetCacheAsync(
                        summaryCacheKey,
                        completedSummary,
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = CompletedSummaryCacheTtl,
                        });

                    returnResult.Result = completedSummary;
                }
                finally
                {
                    await ReleaseLockIfOwnedAsync(database, lockKey, lockToken);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] SummarizePostAsync failed: {ex.Message}");
                returnResult.Result = BuildFailedResponse(postId, "AI summary could not be generated. Please try again shortly.");
                returnResult.Message = "An error occurred while generating the summary.";
            }

            return returnResult;
        }

        public async Task<ReturnResult<AICodeExplainResponseDTO>> ExplainCodeAsync(AICodeExplainRequestDTO request)
        {
            var returnResult = new ReturnResult<AICodeExplainResponseDTO>();
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    returnResult.Message = "Code is required.";
                    return returnResult;
                }

                request.Language = NormalizeCodeLanguage(request.Language);
                if (await IsRateLimitExceededAsync("explain", CodeExplainHourlyLimit))
                {
                    returnResult.Message = RateLimitMessage;
                    returnResult.Result = BuildFailedExplainResponse(RateLimitMessage);
                    return returnResult;
                }

                if (!_redis.IsConnected)
                {
                    DevNexusLogger.Instance.Warn("[AiContentService] Redis is unavailable. Falling back to uncached code explanation generation.");
                    return await GenerateUncachedCodeExplanationAsync(request);
                }

                var codeHash = ComputeCodeExplainHash(request.Code, request.Language);
                var cacheKey = BuildCodeExplainCacheKey(codeHash);
                var lockKey = BuildCodeExplainLockKey(codeHash);

                var cachedExplanation = await _cacheService.GetCacheAsync<AICodeExplainResponseDTO>(cacheKey);
                if (cachedExplanation != null)
                {
                    DevNexusLogger.Instance.Debug($"[AiContentService] Code explain cache hit {CodeExplainVersion}:{codeHash[..8]}.");
                    cachedExplanation.Cached = true;
                    cachedExplanation.Status = CompletedStatus;
                    cachedExplanation.Message = null;
                    returnResult.Result = cachedExplanation;
                    return returnResult;
                }

                DevNexusLogger.Instance.Debug($"[AiContentService] Code explain cache miss {CodeExplainVersion}:{codeHash[..8]}.");
                var database = _redis.GetDatabase();
                var lockToken = Guid.NewGuid().ToString("N");
                var ownsLock = await database.StringSetAsync(lockKey, lockToken, CodeToolLockTtl, When.NotExists);
                if (!ownsLock)
                {
                    DevNexusLogger.Instance.Debug($"[AiContentService] Code explain lock conflict {CodeExplainVersion}:{codeHash[..8]}.");
                    await Task.Delay(250);
                    cachedExplanation = await _cacheService.GetCacheAsync<AICodeExplainResponseDTO>(cacheKey);
                    if (cachedExplanation != null)
                    {
                        cachedExplanation.Cached = true;
                        cachedExplanation.Status = CompletedStatus;
                        cachedExplanation.Message = null;
                        returnResult.Result = cachedExplanation;
                        return returnResult;
                    }

                    returnResult.Result = BuildGeneratingExplainResponse();
                    return returnResult;
                }

                try
                {
                    DevNexusLogger.Instance.Debug($"[AiContentService] Code explain lock acquired {CodeExplainVersion}:{codeHash[..8]}.");
                    var aiResult = await _aiWorkerClient.ExplainCodeAsync(request);
                    if (aiResult?.Result == null || string.IsNullOrWhiteSpace(aiResult.Result.Summary))
                    {
                        returnResult.Result = BuildFailedExplainResponse("AI worker could not explain code. Please try again shortly.");
                        returnResult.Message = aiResult?.Message ?? "AI worker could not explain code.";
                        return returnResult;
                    }

                    var completedExplanation = aiResult.Result;
                    completedExplanation.Status = CompletedStatus;
                    completedExplanation.Cached = false;
                    completedExplanation.Message = null;
                    completedExplanation.GeneratedAt = DateTimeOffset.UtcNow;

                    await _cacheService.SetCacheAsync(
                        cacheKey,
                        completedExplanation,
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = CompletedCodeToolCacheTtl,
                        });

                    returnResult.Result = completedExplanation;
                }
                finally
                {
                    await ReleaseLockIfOwnedAsync(database, lockKey, lockToken);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] ExplainCodeAsync failed: {ex.Message}");
                returnResult.Message = "An error occurred while explaining code.";
                returnResult.Result = BuildFailedExplainResponse("AI explanation could not be generated. Please try again shortly.");
            }

            return returnResult;
        }

        public async Task<ReturnResult<AICodeDiagramResponseDTO>> GenerateCodeDiagramAsync(AICodeDiagramRequestDTO request)
        {
            var returnResult = new ReturnResult<AICodeDiagramResponseDTO>();
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    returnResult.Message = "Code is required.";
                    return returnResult;
                }

                request.Language = NormalizeCodeLanguage(request.Language);
                request.DiagramType = NormalizeDiagramType(request.DiagramType);
                if (await IsRateLimitExceededAsync("diagram", CodeDiagramHourlyLimit))
                {
                    returnResult.Message = RateLimitMessage;
                    returnResult.Result = BuildFailedDiagramResponse(request.DiagramType, RateLimitMessage);
                    return returnResult;
                }

                if (!_redis.IsConnected)
                {
                    DevNexusLogger.Instance.Warn("[AiContentService] Redis is unavailable. Falling back to uncached code diagram generation.");
                    return await GenerateUncachedCodeDiagramAsync(request);
                }

                var codeHash = ComputeCodeDiagramHash(request.Code, request.Language, request.DiagramType);
                var cacheKey = BuildCodeDiagramCacheKey(codeHash);
                var lockKey = BuildCodeDiagramLockKey(codeHash);

                if (!request.ForceRegenerate)
                {
                    var cachedDiagram = await _cacheService.GetCacheAsync<AICodeDiagramResponseDTO>(cacheKey);
                    if (cachedDiagram != null)
                    {
                        DevNexusLogger.Instance.Debug($"[AiContentService] Code diagram cache hit {CodeDiagramVersion}:{codeHash[..8]}.");
                        cachedDiagram.Cached = true;
                        cachedDiagram.Status = CompletedStatus;
                        cachedDiagram.Message = null;
                        returnResult.Result = cachedDiagram;
                        return returnResult;
                    }
                }

                DevNexusLogger.Instance.Debug($"[AiContentService] Code diagram cache miss {CodeDiagramVersion}:{codeHash[..8]}.");
                var database = _redis.GetDatabase();
                var lockToken = Guid.NewGuid().ToString("N");
                var ownsLock = await database.StringSetAsync(lockKey, lockToken, CodeToolLockTtl, When.NotExists);
                if (!ownsLock)
                {
                    DevNexusLogger.Instance.Debug($"[AiContentService] Code diagram lock conflict {CodeDiagramVersion}:{codeHash[..8]}.");
                    if (!request.ForceRegenerate)
                    {
                        await Task.Delay(250);
                        var cachedDiagram = await _cacheService.GetCacheAsync<AICodeDiagramResponseDTO>(cacheKey);
                        if (cachedDiagram != null)
                        {
                            cachedDiagram.Cached = true;
                            cachedDiagram.Status = CompletedStatus;
                            cachedDiagram.Message = null;
                            returnResult.Result = cachedDiagram;
                            return returnResult;
                        }
                    }

                    returnResult.Result = BuildGeneratingDiagramResponse(request.DiagramType);
                    return returnResult;
                }

                try
                {
                    DevNexusLogger.Instance.Debug($"[AiContentService] Code diagram lock acquired {CodeDiagramVersion}:{codeHash[..8]}.");
                    var aiResult = await _aiWorkerClient.GenerateCodeDiagramAsync(request);
                    if (aiResult?.Result == null || string.IsNullOrWhiteSpace(aiResult.Result.MermaidCode))
                    {
                        returnResult.Result = BuildFailedDiagramResponse(request.DiagramType, "AI worker could not generate a diagram. Please try again shortly.");
                        returnResult.Message = aiResult?.Message ?? "AI worker could not generate a diagram.";
                        return returnResult;
                    }

                    var completedDiagram = aiResult.Result;
                    completedDiagram.Status = CompletedStatus;
                    completedDiagram.Cached = false;
                    completedDiagram.Message = null;
                    completedDiagram.GeneratedAt = DateTimeOffset.UtcNow;

                    await _cacheService.SetCacheAsync(
                        cacheKey,
                        completedDiagram,
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = CompletedCodeToolCacheTtl,
                        });

                    returnResult.Result = completedDiagram;
                }
                finally
                {
                    await ReleaseLockIfOwnedAsync(database, lockKey, lockToken);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] GenerateCodeDiagramAsync failed: {ex.Message}");
                returnResult.Message = "An error occurred while generating the code diagram.";
                returnResult.Result = BuildFailedDiagramResponse(request.DiagramType, "AI diagram could not be generated. Please try again shortly.");
            }

            return returnResult;
        }

        public static bool IsRateLimitMessage(string? message)
        {
            return string.Equals(message, RateLimitMessage, StringComparison.Ordinal);
        }

        private static SummarizePostResponseDTO BuildFailedResponse(string postId, string message)
        {
            return new SummarizePostResponseDTO
            {
                PostId = postId,
                SummaryPoints = [],
                Cached = false,
                Status = FailedStatus,
                Message = message,
            };
        }

        private async Task<ReturnResult<SummarizePostResponseDTO>> GenerateUncachedSummaryAsync(
            string postId,
            string content,
            string language)
        {
            var returnResult = new ReturnResult<SummarizePostResponseDTO>();
            var aiResult = await _aiWorkerClient.SummarizeContentAsync(new AISummarizeRequestDTO
            {
                Content = content,
                Language = language,
            });

            if (aiResult?.Result == null ||
                aiResult.Result.SummaryPoints == null ||
                aiResult.Result.SummaryPoints.Count == 0)
            {
                returnResult.Result = BuildFailedResponse(
                    postId,
                    "AI worker could not generate a summary. Please try again shortly.");
                returnResult.Message = aiResult?.Message ?? "AI worker could not generate a summary.";
                return returnResult;
            }

            returnResult.Result = new SummarizePostResponseDTO
            {
                PostId = postId,
                SummaryPoints = aiResult.Result.SummaryPoints,
                OriginalEstimatedReadTimeSeconds = aiResult.Result.EstimatedReadTimeSeconds,
                SummaryEstimatedReadTimeSeconds = 60,
                Cached = false,
                Status = CompletedStatus,
                GeneratedAt = DateTimeOffset.UtcNow,
            };

            return returnResult;
        }

        private async Task<ReturnResult<AICodeExplainResponseDTO>> GenerateUncachedCodeExplanationAsync(AICodeExplainRequestDTO request)
        {
            var returnResult = new ReturnResult<AICodeExplainResponseDTO>();
            var aiResult = await _aiWorkerClient.ExplainCodeAsync(request);
            if (aiResult?.Result == null || string.IsNullOrWhiteSpace(aiResult.Result.Summary))
            {
                returnResult.Result = BuildFailedExplainResponse("AI worker could not explain code. Please try again shortly.");
                returnResult.Message = aiResult?.Message ?? "AI worker could not explain code.";
                return returnResult;
            }

            aiResult.Result.Status = CompletedStatus;
            aiResult.Result.Cached = false;
            aiResult.Result.Message = null;
            aiResult.Result.GeneratedAt = DateTimeOffset.UtcNow;
            returnResult.Result = aiResult.Result;
            return returnResult;
        }

        private async Task<ReturnResult<AICodeDiagramResponseDTO>> GenerateUncachedCodeDiagramAsync(AICodeDiagramRequestDTO request)
        {
            var returnResult = new ReturnResult<AICodeDiagramResponseDTO>();
            var aiResult = await _aiWorkerClient.GenerateCodeDiagramAsync(request);
            if (aiResult?.Result == null || string.IsNullOrWhiteSpace(aiResult.Result.MermaidCode))
            {
                returnResult.Result = BuildFailedDiagramResponse(request.DiagramType, "AI worker could not generate a diagram. Please try again shortly.");
                returnResult.Message = aiResult?.Message ?? "AI worker could not generate a diagram.";
                return returnResult;
            }

            aiResult.Result.Status = CompletedStatus;
            aiResult.Result.Cached = false;
            aiResult.Result.Message = null;
            aiResult.Result.GeneratedAt = DateTimeOffset.UtcNow;
            returnResult.Result = aiResult.Result;
            return returnResult;
        }

        private static AICodeExplainResponseDTO BuildGeneratingExplainResponse()
        {
            return new AICodeExplainResponseDTO
            {
                Status = GeneratingStatus,
                Summary = string.Empty,
                KeyFlow = [],
                WatchOut = [],
                Cached = false,
                Message = "AI is already generating this result. Please try again in a few seconds.",
            };
        }

        private static AICodeDiagramResponseDTO BuildGeneratingDiagramResponse(string diagramType)
        {
            return new AICodeDiagramResponseDTO
            {
                Status = GeneratingStatus,
                MermaidCode = string.Empty,
                DiagramType = diagramType == "sequence" ? "sequence" : "flowchart",
                Cached = false,
                Message = "AI is already generating this diagram. Please try again in a few seconds.",
            };
        }

        private static AICodeExplainResponseDTO BuildFailedExplainResponse(string message)
        {
            return new AICodeExplainResponseDTO
            {
                Status = FailedStatus,
                Summary = string.Empty,
                KeyFlow = [],
                WatchOut = [],
                Cached = false,
                Message = message,
            };
        }

        private static AICodeDiagramResponseDTO BuildFailedDiagramResponse(string diagramType, string message)
        {
            return new AICodeDiagramResponseDTO
            {
                Status = FailedStatus,
                MermaidCode = string.Empty,
                DiagramType = diagramType == "sequence" ? "sequence" : "flowchart",
                Cached = false,
                Message = message,
            };
        }

        private async Task<bool> IsRateLimitExceededAsync(string feature, int limit)
        {
            if (!_redis.IsConnected)
            {
                DevNexusLogger.Instance.Warn($"[AiContentService] Redis is unavailable. Skipping code {feature} rate limit.");
                return false;
            }

            try
            {
                var userKey = !string.IsNullOrWhiteSpace(_userContext.ProfileId)
                    ? _userContext.ProfileId
                    : _userContext.UserId;
                if (string.IsNullOrWhiteSpace(userKey))
                {
                    userKey = "unknown";
                }

                var now = DateTimeOffset.UtcNow;
                var key = $"ai:rate:user:{userKey}:code:{feature}:{now:yyyyMMddHH}";
                var database = _redis.GetDatabase();
                var count = await database.StringIncrementAsync(key);
                if (count == 1)
                {
                    var expiresAt = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, 0, 0, TimeSpan.Zero).AddHours(1);
                    await database.KeyExpireAsync(key, expiresAt - now);
                }

                if (count > limit)
                {
                    DevNexusLogger.Instance.Warn($"[AiContentService] Code {feature} rate limit exceeded for user {userKey}.");
                    return true;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Warn($"[AiContentService] Failed to apply code {feature} rate limit: {ex.Message}");
            }

            return false;
        }

        private static string NormalizeLanguage(string? language)
        {
            var normalized = string.IsNullOrWhiteSpace(language)
                ? "auto"
                : language.Trim().ToLowerInvariant();

            return normalized is "auto" or "vi" or "en" ? normalized : "auto";
        }

        private static string NormalizeCodeLanguage(string? language)
        {
            return string.IsNullOrWhiteSpace(language)
                ? "auto"
                : language.Trim().ToLowerInvariant();
        }

        private static string NormalizeDiagramType(string? diagramType)
        {
            var normalized = string.IsNullOrWhiteSpace(diagramType)
                ? "auto"
                : diagramType.Trim().ToLowerInvariant();

            return normalized is "auto" or "flowchart" or "sequence" ? normalized : "auto";
        }

        private static string NormalizeForHash(string? value)
        {
            return (value ?? string.Empty)
                .Replace("\r\n", "\n")
                .Replace("\r", "\n")
                .Trim();
        }

        private static string ComputeCodeExplainHash(string code, string language)
        {
            var input = string.Join(
                "\n",
                "tool=explain",
                $"version={CodeExplainVersion}",
                $"language={language}",
                $"code={NormalizeForHash(code)}");
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string ComputeCodeDiagramHash(string code, string language, string diagramType)
        {
            var input = string.Join(
                "\n",
                "tool=diagram",
                $"version={CodeDiagramVersion}",
                $"language={language}",
                $"diagramType={diagramType}",
                $"code={NormalizeForHash(code)}");
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string ComputeContentHash(string title, string content)
        {
            var input = $"{NormalizeForHash(title)}\n\n{NormalizeForHash(content)}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string BuildSummaryCacheKey(string postId, string language, string contentHash)
        {
            return $"ai:post-summary:{postId}:{language}:{contentHash}";
        }

        private static string BuildSummaryLockKey(string postId, string language, string contentHash)
        {
            return $"ai:post-summary-lock:{postId}:{language}:{contentHash}";
        }

        private static string BuildCodeExplainCacheKey(string hash)
        {
            return $"ai:code:explain:{CodeExplainVersion}:{hash}";
        }

        private static string BuildCodeDiagramCacheKey(string hash)
        {
            return $"ai:code:diagram:{CodeDiagramVersion}:{hash}";
        }

        private static string BuildCodeExplainLockKey(string hash)
        {
            return $"lock:ai:code:explain:{CodeExplainVersion}:{hash}";
        }

        private static string BuildCodeDiagramLockKey(string hash)
        {
            return $"lock:ai:code:diagram:{CodeDiagramVersion}:{hash}";
        }

        private static async Task ReleaseLockIfOwnedAsync(IDatabase database, string lockKey, string lockToken)
        {
            try
            {
                const string releaseScript = """
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("del", KEYS[1])
                    else
                        return 0
                    end
                    """;

                await database.ScriptEvaluateAsync(
                    releaseScript,
                    new RedisKey[] { lockKey },
                    new RedisValue[] { lockToken });
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Warn($"[AiContentService] Failed to release summary lock {lockKey}: {ex.Message}");
            }
        }
    }
}
