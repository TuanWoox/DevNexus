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
        private const string CompletedStatus = "Completed";
        private const string GeneratingStatus = "Generating";
        private const string FailedStatus = "Failed";

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
                    })
                    .FirstOrDefaultAsync();

                if (post == null)
                {
                    returnResult.Message = "Post not found.";
                    return returnResult;
                }

                var canViewModerationState = post.ModerationStatus == ModerationStatus.Approved
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
                returnResult = await _aiWorkerClient.ExplainCodeAsync(request);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] ExplainCodeAsync failed: {ex.Message}");
                returnResult.Message = "An error occurred while explaining code.";
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
                returnResult = await _aiWorkerClient.GenerateCodeDiagramAsync(request);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentService] GenerateCodeDiagramAsync failed: {ex.Message}");
                returnResult.Message = "An error occurred while generating the code diagram.";
            }

            return returnResult;
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
