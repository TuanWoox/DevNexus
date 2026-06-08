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
        private readonly IQAPostFirstResponderTriggerService _firstResponderTriggerService;

        public ModerationService(
            ApplicationDbContext context,
            IBackgroundJobClient backgroundJobClient,
            IQAPostFirstResponderTriggerService firstResponderTriggerService)
        {
            _context = context;
            _backgroundJobClient = backgroundJobClient;
            _firstResponderTriggerService = firstResponderTriggerService;
        }

        public async Task<ReturnResult<bool>> HandleCallbackAsync(ModerationCallbackDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrWhiteSpace(dto.TargetId))
                {
                    result.Message = "Moderation target id is required.";
                    return result;
                }

                var target = await LoadModerationTargetAsync(dto.TargetType, dto.TargetId);
                if (target == null)
                {
                    result.Message = $"{dto.TargetType} {dto.TargetId} not found.";
                    return result;
                }

                if (target.ModerationStatus != ModerationStatus.Pending)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for {dto.TargetType} {dto.TargetId}: already {target.ModerationStatus}");
                    result.Result = true;
                    return result;
                }

                if (target.Deleted)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for {dto.TargetType} {dto.TargetId}: target deleted.");
                    result.Result = true;
                    return result;
                }

                if (IsStaleModerationMessage(dto.ModerationVersion, dto.ContentHash, target))
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for {dto.TargetType} {dto.TargetId}: stale version/hash.");
                    result.Result = true;
                    return result;
                }

                target.ModerationStatus = dto.Decision.ToLower() switch
                {
                    "approve" => ModerationStatus.Approved,
                    "flag" => ModerationStatus.Flagged,
                    "escalate" => ModerationStatus.InReview,
                    _ => ModerationStatus.InReview
                };
                target.ModerationReason = target.ModerationStatus == ModerationStatus.Approved
                    ? null
                    : BuildAiModerationReason(dto, target.ModerationStatus);

                ApplyTargetState(target);
                await UpsertModerationResultAsync(dto, dto.TargetType, dto.TargetId, target.ModerationReason);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] {dto.TargetType} {dto.TargetId} -> {target.ModerationStatus} (decision={dto.Decision})");

                await EnqueueModerationNotification(dto.TargetType, target);

                if (target.ModerationStatus == ModerationStatus.Approved)
                {
                    if (target.Entity is QAPost)
                    {
                        await _firstResponderTriggerService.TryEnqueueAsync(target.Id, "Moderation");
                    }

                    await EnqueueApprovedTargetNotification(dto.TargetType, target);
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

        public async Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueForReviewAsync(ModerationQueueRequestDTO dto)
        {
            var result = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                if (string.IsNullOrWhiteSpace(dto.TargetId))
                {
                    result.Message = "Moderation target id is required.";
                    return result;
                }

                var target = await LoadModerationTargetAsync(dto.TargetType, dto.TargetId);
                if (target == null)
                {
                    result.Message = $"{dto.TargetType} {dto.TargetId} not found.";
                    return result;
                }

                if (target.Deleted ||
                    target.ModerationStatus != ModerationStatus.Pending ||
                    IsStaleModerationMessage(dto.ModerationVersion, dto.ContentHash, target))
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Queue request ignored for {dto.TargetType} {dto.TargetId}: stale or no longer pending.");
                    result.Result = new ModerationQueueResponseDTO { Id = string.Empty };
                    return result;
                }

                var entry = new ModerationQueueEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    TargetType = dto.TargetType,
                    TargetId = dto.TargetId,
                    Reason = dto.Reason,
                    Tier1Score = dto.Tier1Score,
                    Tier2Reasoning = dto.Tier2Reasoning,
                };

                _context.ModerationQueueEntries.Add(entry);
                await _context.SaveChangesAsync();

                result.Result = new ModerationQueueResponseDTO { Id = entry.Id };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating moderation queue entry: {ex.Message}";
            }
            return result;
        }

        public Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueBannedKeywordReviewAsync(
            string postId,
            IReadOnlyCollection<string> matchedKeywords)
        {
            return EnqueueBannedKeywordReviewAsync(ModerationTargetType.Post, postId, matchedKeywords);
        }

        public async Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueBannedKeywordReviewAsync(
            ModerationTargetType targetType,
            string targetId,
            IReadOnlyCollection<string> matchedKeywords)
        {
            var result = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                var target = await LoadModerationTargetAsync(targetType, targetId);
                if (target == null)
                {
                    result.Message = $"{targetType} {targetId} not found.";
                    return result;
                }

                var keywordPreview = matchedKeywords?
                    .Where(k => !string.IsNullOrWhiteSpace(k))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList() ?? new List<string>();
                var reasoning = keywordPreview.Any()
                    ? $"Banned keywords detected: {string.Join(", ", keywordPreview)}"
                    : "Banned keywords detected.";

                target.ModerationStatus = ModerationStatus.InReview;
                target.ModerationReason = reasoning.Length <= 1000 ? reasoning : reasoning[..1000];
                ApplyTargetState(target);

                var existingEntry = await _context.ModerationQueueEntries
                    .FirstOrDefaultAsync(e => e.TargetType == targetType && e.TargetId == targetId && e.ResolvedAt == null);

                if (existingEntry != null)
                {
                    await _context.SaveChangesAsync();
                    result.Result = new ModerationQueueResponseDTO { Id = existingEntry.Id };
                    return result;
                }

                var entry = new ModerationQueueEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    TargetType = targetType,
                    TargetId = targetId,
                    Reason = "Banned keyword detected",
                    Tier1Score = 1,
                    Tier2Reasoning = target.ModerationReason,
                };

                _context.ModerationQueueEntries.Add(entry);
                await _context.SaveChangesAsync();

                result.Result = new ModerationQueueResponseDTO { Id = entry.Id };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating banned-keyword moderation queue entry: {ex.Message}";
            }
            return result;
        }

        private async Task UpsertModerationResultAsync(
            ModerationCallbackDTO dto,
            ModerationTargetType targetType,
            string targetId,
            string? moderationReason)
        {
            var moderationResult = await _context.PostModerationResults
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TargetType == targetType && r.TargetId == targetId);

            if (moderationResult == null)
            {
                moderationResult = new PostModerationResult
                {
                    Id = Guid.NewGuid().ToString(),
                    TargetType = targetType,
                    TargetId = targetId,
                };
                _context.PostModerationResults.Add(moderationResult);
            }

            moderationResult.TextScore = dto.TextScore;
            moderationResult.ImageScore = dto.ImageScore;
            moderationResult.CombinedScore = dto.CombinedScore;
            moderationResult.Decision = dto.Decision;
            moderationResult.Reasoning = NormalizeModerationReason(dto.Reasoning) ?? moderationReason;
            moderationResult.ReviewedAt = DateTimeOffset.UtcNow;
            moderationResult.Deleted = false;
            moderationResult.DateDeleted = null;
        }

        private async Task<ModerationTarget?> LoadModerationTargetAsync(ModerationTargetType targetType, string targetId)
        {
            switch (targetType)
            {
                case ModerationTargetType.Post:
                    var post = await _context.Posts
                        .IgnoreQueryFilters()
                        .Include(p => p.Author)
                        .FirstOrDefaultAsync(p => p.Id == targetId);
                    return post == null ? null : ModerationTarget.FromPost(post);

                case ModerationTargetType.Answer:
                    var answer = await _context.Answers
                        .IgnoreQueryFilters()
                        .Include(a => a.Author)
                        .Include(a => a.QAPost)
                        .FirstOrDefaultAsync(a => a.Id == targetId);
                    return answer == null ? null : ModerationTarget.FromAnswer(answer);

                case ModerationTargetType.Comment:
                    var comment = await _context.Comments
                        .IgnoreQueryFilters()
                        .Include(c => c.Author)
                        .Include(c => c.Post)
                        .Include(c => c.Answer)
                            .ThenInclude(a => a!.QAPost)
                        .Include(c => c.ReplyToComment)
                            .ThenInclude(rc => rc!.Post)
                        .Include(c => c.ReplyToComment)
                            .ThenInclude(rc => rc!.Answer)
                                .ThenInclude(a => a!.QAPost)
                        .FirstOrDefaultAsync(c => c.Id == targetId);
                    return comment == null ? null : ModerationTarget.FromComment(comment);

                default:
                    return null;
            }
        }

        private static void ApplyTargetState(ModerationTarget target)
        {
            switch (target.Entity)
            {
                case Post post:
                    post.ModerationStatus = target.ModerationStatus;
                    post.ModerationReason = target.ModerationReason;
                    break;
                case Answer answer:
                    answer.ModerationStatus = target.ModerationStatus;
                    answer.ModerationReason = target.ModerationReason;
                    break;
                case Comment comment:
                    comment.ModerationStatus = target.ModerationStatus;
                    comment.ModerationReason = target.ModerationReason;
                    break;
            }
        }

        private static bool IsStaleModerationMessage(int? moderationVersion, string? contentHash, ModerationTarget target)
        {
            return moderationVersion != target.ModerationVersion ||
                   !string.Equals(contentHash, target.ModerationContentHash, StringComparison.Ordinal);
        }

        private async Task EnqueueModerationNotification(ModerationTargetType targetType, ModerationTarget target)
        {
            if (target.ModerationStatus != ModerationStatus.Approved)
            {
                var notificationEvent = new NotiicationCreatedEntityDTO
                {
                    EventType = NotificationEventType.MODERATION_RESULT,
                    ActorType = ActorType.System,
                    ActorId = "devnexus",
                    ActorName = "DevNexus",
                    RecipientId = target.AuthorId,
                    EntityType = GetNotificationEntityType(targetType, target.Entity),
                    EntityId = target.Id,
                    EntityTitle = target.Title,
                    EntityPreview = target.ModerationStatus.ToString(),
                    ActionUrl = target.ActionUrl,
                    Timestamp = DateTime.UtcNow,
                    Message = $"Your {GetTargetDisplayName(targetType, target.Entity)} is {target.ModerationStatus}."
                };

                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublicNotification(notificationEvent, "notifications.moderation"));
            }

            if (target.Entity is not Post post ||
                post.ModerationStatus != ModerationStatus.Approved ||
                string.IsNullOrEmpty(post.CommunityId) ||
                post.CommunityApprovalStatus != CommunityApprovalStatus.Pending)
            {
                return;
            }

            var community = await _context.Communities
                .Include(c => c.Moderators)
                .FirstOrDefaultAsync(c => c.Id == post.CommunityId);

            if (community == null)
            {
                return;
            }

            if (post.Author == null)
            {
                await _context.Entry(post).Reference(p => p.Author).LoadAsync();
            }

            var recipientIds = new[] { community.OwnerId }
                .Concat(community.Moderators.Select(m => m.ModeratorId))
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            if (!recipientIds.Any())
            {
                return;
            }

            var contentCreatedEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.CONTENT_CREATED,
                ActorType = ActorType.Profile,
                ActorId = post.AuthorId,
                ActorName = post.Author?.FullName,
                ActorAvatarUrl = post.Author?.AvatarUrl,
                RecipientId = recipientIds,
                EntityType = post is QAPost ? NotificationEntityType.QUESTION : NotificationEntityType.POST,
                EntityId = post.Id,
                EntityTitle = post.Title,
                EntityPreview = post.Content?.Length > 100 ? post.Content[..100] : post.Content,
                ActionUrl = $"/communities/{post.CommunityId}/moderate-pending",
                Timestamp = DateTime.UtcNow,
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(contentCreatedEvent, "notifications.community"));
        }

        private Task EnqueueApprovedTargetNotification(ModerationTargetType targetType, ModerationTarget target)
        {
            return targetType switch
            {
                ModerationTargetType.Answer when target.Entity is Answer answer => EnqueueApprovedAnswerNotification(answer),
                ModerationTargetType.Comment when target.Entity is Comment comment => EnqueueApprovedCommentNotification(comment),
                _ => Task.CompletedTask
            };
        }

        private Task EnqueueApprovedAnswerNotification(Answer answer)
        {
            var recipientId = answer.QAPost?.AuthorId;
            if (string.IsNullOrWhiteSpace(recipientId) || recipientId == answer.AuthorId)
            {
                return Task.CompletedTask;
            }

            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.NEW_ANSWER,
                ActorType = ActorType.Profile,
                ActorId = answer.AuthorId,
                ActorName = answer.Author?.FullName,
                ActorAvatarUrl = answer.Author?.AvatarUrl,
                RecipientId = recipientId,
                EntityType = NotificationEntityType.POST,
                EntityId = answer.QAPostId,
                EntityTitle = answer.QAPost?.Title,
                EntityPreview = answer.Content?.Substring(0, Math.Min(200, answer.Content?.Length ?? 0)),
                ActionUrl = $"/questions/{answer.QAPostId}#answer-{answer.Id}",
                Timestamp = DateTime.UtcNow,
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.answer"));
            return Task.CompletedTask;
        }

        private Task EnqueueApprovedCommentNotification(Comment comment)
        {
            var rootPost = comment.Post ?? comment.Answer?.QAPost ?? comment.ReplyToComment?.Post ?? comment.ReplyToComment?.Answer?.QAPost;
            var recipientId = comment.ReplyToComment?.AuthorId
                ?? comment.Answer?.AuthorId
                ?? rootPost?.AuthorId;

            if (rootPost == null ||
                string.IsNullOrWhiteSpace(recipientId) ||
                recipientId == comment.AuthorId)
            {
                return Task.CompletedTask;
            }

            var isQuestion = rootPost is QAPost;
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = comment.ReplyToCommentId != null
                    ? NotificationEventType.REPLY_COMMENT
                    : comment.AnswerId != null
                        ? NotificationEventType.COMMENT_ANSWER
                        : isQuestion
                            ? NotificationEventType.COMMENT_QUESTION
                            : NotificationEventType.COMMENT_POST,
                ActorType = ActorType.Profile,
                ActorId = comment.AuthorId,
                ActorName = comment.Author?.FullName,
                ActorAvatarUrl = comment.Author?.AvatarUrl,
                RecipientId = recipientId,
                EntityType = NotificationEntityType.COMMENT,
                EntityId = comment.Id,
                EntityTitle = rootPost.Title,
                EntityPreview = comment.Content?.Substring(0, Math.Min(200, comment.Content?.Length ?? 0)),
                ActionUrl = isQuestion
                    ? $"/questions/{rootPost.Id}#comment-{comment.Id}"
                    : $"/post/{rootPost.Id}#comment-{comment.Id}",
                Timestamp = DateTime.UtcNow,
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.comment"));
            return Task.CompletedTask;
        }

        private static NotificationEntityType GetNotificationEntityType(ModerationTargetType targetType, object entity)
        {
            return targetType switch
            {
                ModerationTargetType.Post when entity is QAPost => NotificationEntityType.QUESTION,
                ModerationTargetType.Post => NotificationEntityType.POST,
                ModerationTargetType.Answer => NotificationEntityType.POST,
                ModerationTargetType.Comment => NotificationEntityType.COMMENT,
                _ => NotificationEntityType.POST
            };
        }

        private static string GetTargetDisplayName(ModerationTargetType targetType, object entity)
        {
            return targetType switch
            {
                ModerationTargetType.Post when entity is QAPost => "question",
                ModerationTargetType.Post => "post",
                ModerationTargetType.Answer => "answer",
                ModerationTargetType.Comment => "comment",
                _ => "content"
            };
        }

        private static string? NormalizeModerationReason(string? reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
            {
                return null;
            }

            var normalized = reason.Trim();
            return normalized.Length <= 1000 ? normalized : normalized[..1000];
        }

        private static string BuildAiModerationReason(ModerationCallbackDTO dto, ModerationStatus status)
        {
            var explicitReason = NormalizeModerationReason(dto.Reasoning);
            if (!string.IsNullOrWhiteSpace(explicitReason))
            {
                return explicitReason;
            }

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

        private sealed class ModerationTarget
        {
            public string Id { get; private init; } = null!;
            public string? Title { get; private init; }
            public string Content { get; private init; } = null!;
            public string AuthorId { get; private init; } = null!;
            public bool Deleted { get; private init; }
            public ModerationStatus ModerationStatus { get; set; }
            public string? ModerationReason { get; set; }
            public int ModerationVersion { get; private init; }
            public string? ModerationContentHash { get; private init; }
            public string ActionUrl { get; private init; } = null!;
            public object Entity { get; private init; } = null!;

            public static ModerationTarget FromPost(Post post) => new()
            {
                Id = post.Id,
                Title = post.Title,
                Content = post.Content,
                AuthorId = post.AuthorId,
                Deleted = post.Deleted,
                ModerationStatus = post.ModerationStatus,
                ModerationReason = post.ModerationReason,
                ModerationVersion = post.ModerationVersion,
                ModerationContentHash = post.ModerationContentHash,
                ActionUrl = post is QAPost ? $"/questions/{post.Id}" : $"/post/{post.Id}",
                Entity = post,
            };

            public static ModerationTarget FromAnswer(Answer answer) => new()
            {
                Id = answer.Id,
                Title = answer.QAPost?.Title ?? "Answer",
                Content = answer.Content,
                AuthorId = answer.AuthorId,
                Deleted = answer.Deleted,
                ModerationStatus = answer.ModerationStatus,
                ModerationReason = answer.ModerationReason,
                ModerationVersion = answer.ModerationVersion,
                ModerationContentHash = answer.ModerationContentHash,
                ActionUrl = $"/questions/{answer.QAPostId}#answer-{answer.Id}",
                Entity = answer,
            };

            public static ModerationTarget FromComment(Comment comment)
            {
                var rootPost = comment.Post ?? comment.Answer?.QAPost ?? comment.ReplyToComment?.Post ?? comment.ReplyToComment?.Answer?.QAPost;
                return new ModerationTarget
                {
                    Id = comment.Id,
                    Title = rootPost?.Title ?? "Comment",
                    Content = comment.Content,
                    AuthorId = comment.AuthorId,
                    Deleted = comment.Deleted,
                    ModerationStatus = comment.ModerationStatus,
                    ModerationReason = comment.ModerationReason,
                    ModerationVersion = comment.ModerationVersion,
                    ModerationContentHash = comment.ModerationContentHash,
                    ActionUrl = rootPost is QAPost
                        ? $"/questions/{rootPost.Id}#comment-{comment.Id}"
                        : $"/post/{rootPost?.Id}#comment-{comment.Id}",
                    Entity = comment,
                };
            }
        }
    }
}
