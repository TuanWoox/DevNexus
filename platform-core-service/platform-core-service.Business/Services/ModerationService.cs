using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ModerationService : IModerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public ModerationService(ApplicationDbContext context, IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ReturnResult<bool>> HandleCallbackAsync(ModerationCallbackDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Use IgnoreQueryFilters so we can still handle callbacks for soft-deleted posts
                // (Race condition: user deleted post while AI pipeline was running)
                // Load only the base post first — Author/Tags are loaded conditionally below
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == dto.PostId);

                if (post == null)
                {
                    result.Message = $"Post {dto.PostId} not found.";
                    return result;
                }

                // Idempotency guard — if already processed, return success silently
                // Prevents double-processing if AI Worker retries the callback
                if (post.ModerationStatus != ModerationStatus.Pending)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for post {dto.PostId} — already in status {post.ModerationStatus}");
                    result.Result = true;
                    return result;
                }

                // If the post was soft-deleted while AI was processing — ignore, do not republish
                if (post.Deleted)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for post {dto.PostId} — post was deleted.");
                    result.Result = true;
                    return result;
                }

                // Map AI Worker decision string → ModerationStatus enum
                post.ModerationStatus = dto.Decision.ToLower() switch
                {
                    "approve"  => ModerationStatus.Approved,
                    "flag"     => ModerationStatus.Flagged,
                    "escalate" => ModerationStatus.InReview,
                    _ => ModerationStatus.InReview  // unknown decision → escalate to be safe
                };

                post.ModerationReason = post.ModerationStatus == ModerationStatus.Approved
                    ? null
                    : BuildAiModerationReason(dto, post.ModerationStatus);

                var moderationResult = await _context.PostModerationResults
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.PostId == dto.PostId);

                if (moderationResult == null)
                {
                    moderationResult = new PostModerationResult
                    {
                        Id = Guid.NewGuid().ToString(),
                        PostId = dto.PostId,
                    };

                    _context.PostModerationResults.Add(moderationResult);
                }

                moderationResult.TextScore = dto.TextScore;
                moderationResult.ImageScore = dto.ImageScore;
                moderationResult.CombinedScore = dto.CombinedScore;
                moderationResult.Decision = dto.Decision;
                moderationResult.Reasoning = NormalizeModerationReason(dto.Reasoning) ?? post.ModerationReason;
                moderationResult.ReviewedAt = DateTimeOffset.UtcNow;
                moderationResult.Deleted = false;
                moderationResult.DateDeleted = null;

                _context.Posts.Update(post);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] Post {dto.PostId} → {post.ModerationStatus} (decision={dto.Decision})");

                EnqueueModerationNotification(post);

                if (post.ModerationStatus == ModerationStatus.Approved && post is QAPost)
                {
                    // Load Author and Tags now that we know this is a QA post
                    await _context.Entry(post).Reference(p => p.Author).LoadAsync();
                    await _context.Entry(post).Collection(p => p.PostTags).Query()
                        .Include(pt => pt.Tag).LoadAsync();

                    var aiRequest = new platform_core_service.Common.Models.DTOs.AIDTO.AIFirstResponderRequestDTO
                    {
                        PostId = post.Id,
                        Title = post.Title,
                        Content = post.Content,
                        Tags = post.PostTags?.Select(pt => pt.Tag.Name).ToList() ?? new List<string>(),
                        AuthorId = post.AuthorId,
                        AuthorDisplayName = post.Author?.FullName ?? "Unknown",
                        CreatedAt = post.DateCreated ?? DateTimeOffset.UtcNow
                    };

                    string routingKey = "ai.task.firstresponder.request";

                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                        x => x.PublicAiTask(aiRequest, routingKey, MessageBusEnum.Create, MessageBusEntityEnum.AIFirstResponder)
                    );

                    DevNexusLogger.Instance.Debug($"[Moderation] AI First Responder Task queued for QA Post {post.Id}");
                }

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while processing moderation callback: {ex.Message}";
            }
            return result;
        }

        private void EnqueueModerationNotification(Post post)
        {
            var isQuestion = post is QAPost;
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.MODERATION_RESULT,
                ActorId = post.AuthorId,
                RecipientId = post.AuthorId,
                EntityType = isQuestion ? NotificationEntityType.QUESTION : NotificationEntityType.POST,
                EntityId = post.Id,
                EntityTitle = post.Title,
                EntityPreview = post.ModerationStatus.ToString(),
                ActionUrl = isQuestion ? $"/questions/{post.Id}" : $"/post/{post.Id}",
                Timestamp = DateTime.UtcNow,
                Message = $"Your {(isQuestion ? "question" : "post")} is {post.ModerationStatus}."
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.moderation"));
        }

        public async Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueForReviewAsync(ModerationQueueRequestDTO dto)
        {
            var result = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .AnyAsync(p => p.Id == dto.PostId);

                if (!post)
                {
                    result.Message = $"Post {dto.PostId} not found.";
                    return result;
                }

                var entry = new ModerationQueueEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = dto.PostId,
                    Reason = dto.Reason,
                    Tier1Score = dto.Tier1Score,
                    Tier2Reasoning = dto.Tier2Reasoning,
                };

                _context.ModerationQueueEntries.Add(entry);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] Queue entry {entry.Id} created for post {dto.PostId}");

                result.Result = new ModerationQueueResponseDTO { Id = entry.Id };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating moderation queue entry: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueBannedKeywordReviewAsync(string postId, IReadOnlyCollection<string> matchedKeywords)
        {
            var result = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found.";
                    return result;
                }

                post.ModerationStatus = ModerationStatus.InReview;

                var keywordPreview = matchedKeywords?.Where(k => !string.IsNullOrWhiteSpace(k)).Distinct().ToList() ?? new List<string>();
                var reasoning = keywordPreview.Any()
                    ? $"Banned keywords detected: {string.Join(", ", keywordPreview)}"
                    : "Banned keywords detected.";

                post.ModerationReason = reasoning.Length <= 1000 ? reasoning : reasoning[..1000];

                var existingEntry = await _context.ModerationQueueEntries
                    .FirstOrDefaultAsync(e => e.PostId == postId && e.ResolvedAt == null);

                if (existingEntry != null)
                {
                    await _context.SaveChangesAsync();
                    result.Result = new ModerationQueueResponseDTO { Id = existingEntry.Id };
                    return result;
                }

                var entry = new ModerationQueueEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = postId,
                    Reason = "Banned keyword detected",
                    Tier1Score = 1,
                    Tier2Reasoning = post.ModerationReason,
                };

                _context.ModerationQueueEntries.Add(entry);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] Banned-keyword queue entry {entry.Id} created for post {postId}");

                result.Result = new ModerationQueueResponseDTO { Id = entry.Id };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating banned-keyword moderation queue entry: {ex.Message}";
            }
            return result;
        }

        private static string? NormalizeModerationReason(string? reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                return null;

            var normalized = reason.Trim();
            return normalized.Length <= 1000 ? normalized : normalized[..1000];
        }

        private static string BuildAiModerationReason(ModerationCallbackDTO dto, ModerationStatus status)
        {
            var explicitReason = NormalizeModerationReason(dto.Reasoning);
            if (!string.IsNullOrWhiteSpace(explicitReason))
                return explicitReason;

            var score = dto.CombinedScore ?? dto.TextScore ?? dto.ImageScore;
            var scoreText = score.HasValue ? $" Moderation score: {score.Value:0.000}." : string.Empty;

            var reason = status switch
            {
                ModerationStatus.Flagged => $"Automatically flagged by AI moderation.{scoreText}",
                ModerationStatus.InReview => $"Sent to manual review by AI moderation.{scoreText}",
                _ => $"Reviewed by AI moderation.{scoreText}"
            };

            return reason.Length <= 1000 ? reason : reason[..1000];
        }
    }
}
