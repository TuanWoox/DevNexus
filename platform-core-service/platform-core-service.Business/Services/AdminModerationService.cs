using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Helper;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AdminModerationService : IAdminModerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly IRepository<ModerationQueueEntry, string> _queueRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IAdminAuditLogService _adminAuditLogService;
        private readonly IQAPostFirstResponderTriggerService _firstResponderTriggerService;

        public AdminModerationService(
            ApplicationDbContext context,
            IUserContext userContext,
            IRepository<ModerationQueueEntry, string> queueRepository,
            IBackgroundJobClient backgroundJobClient,
            IAdminAuditLogService adminAuditLogService,
            IQAPostFirstResponderTriggerService firstResponderTriggerService)
        {
            _context = context;
            _userContext = userContext;
            _queueRepository = queueRepository;
            _backgroundJobClient = backgroundJobClient;
            _adminAuditLogService = adminAuditLogService;
            _firstResponderTriggerService = firstResponderTriggerService;
        }

        public async Task<ReturnResult<PagedData<AdminQueueEntryDTO, string>>> GetPendingQueueAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminQueueEntryDTO, string>>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }

                var query = _context.ModerationQueueEntries
                    .Where(e => e.ResolvedAt == null)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _queueRepository.GetPagingAsync<Page<string>, AdminQueueEntryDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving moderation queue: {ex.Message}";
            }
            return result;
        }

        public Task<ReturnResult<bool>> ApproveAsync(AdminQueueResolveDTO dto)
        {
            return ResolveAsync(dto, approved: true);
        }

        public Task<ReturnResult<bool>> RejectAsync(AdminQueueResolveDTO dto)
        {
            return ResolveAsync(dto, approved: false);
        }

        private async Task<ReturnResult<bool>> ResolveAsync(AdminQueueResolveDTO dto, bool approved)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }

                var entry = await _context.ModerationQueueEntries
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entry == null)
                {
                    result.Message = $"Queue entry {dto.Id} not found";
                    return result;
                }

                if (entry.ResolvedAt.HasValue)
                {
                    result.Message = $"Queue entry {dto.Id} is already resolved ({entry.Resolution})";
                    return result;
                }

                var target = await LoadTargetAsync(entry.TargetType, entry.TargetId);
                if (target == null)
                {
                    result.Message = $"{entry.TargetType} {entry.TargetId} not found";
                    return result;
                }

                var rejectionReason = BuildRejectionReason(dto.ModeratorNote, entry.Tier2Reasoning, entry.Reason);
                target.SetModerationState(
                    approved ? ModerationStatus.Approved : ModerationStatus.Flagged,
                    approved ? null : rejectionReason);

                entry.Resolution = approved ? "Approved" : "Rejected";
                entry.ResolvedAt = DateTimeOffset.UtcNow;
                entry.AssignedModeratorId = _userContext.ProfileId;
                entry.ModeratorNote = dto.ModeratorNote?.Trim();

                await _context.SaveChangesAsync();

                await EnqueueModerationNotification(entry.TargetType, target.Entity);

                if (approved && target.Entity is QAPost qaPost)
                {
                    await _firstResponderTriggerService.TryEnqueueAsync(qaPost.Id, "AdminModeration");
                }

                if (approved)
                {
                    await EnqueueApprovedTargetNotification(entry.TargetType, target.Entity);
                }

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while resolving queue entry: {ex.Message}";
            }
            return result;
        }

        private async Task<ModerationTarget?> LoadTargetAsync(ModerationTargetType targetType, string targetId)
        {
            switch (targetType)
            {
                case ModerationTargetType.Post:
                    var post = await _context.Posts
                        .IgnoreQueryFilters()
                        .Include(p => p.Author)
                        .FirstOrDefaultAsync(p => p.Id == targetId);
                    return post == null ? null : new ModerationTarget(post);
                case ModerationTargetType.Answer:
                    var answer = await _context.Answers
                        .IgnoreQueryFilters()
                        .Include(a => a.Author)
                        .Include(a => a.QAPost)
                        .FirstOrDefaultAsync(a => a.Id == targetId);
                    return answer == null ? null : new ModerationTarget(answer);
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
                    return comment == null ? null : new ModerationTarget(comment);
                default:
                    return null;
            }
        }

        private Task EnqueueModerationNotification(ModerationTargetType targetType, object entity)
        {
            var (id, title, authorId, status, displayName, actionUrl, entityType) = GetNotificationTarget(targetType, entity);
            if (status == ModerationStatus.Approved || string.IsNullOrWhiteSpace(authorId))
            {
                return Task.CompletedTask;
            }

            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.MODERATION_RESULT,
                ActorType = ActorType.System,
                ActorId = "devnexus",
                ActorName = "DevNexus",
                RecipientId = authorId,
                EntityType = entityType,
                EntityId = id,
                EntityTitle = title,
                EntityPreview = status.ToString(),
                ActionUrl = actionUrl,
                Timestamp = DateTime.UtcNow,
                Message = $"Your {displayName} is {status}."
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.moderation"));

            return Task.CompletedTask;
        }

        private Task EnqueueApprovedTargetNotification(ModerationTargetType targetType, object entity)
        {
            return targetType switch
            {
                ModerationTargetType.Answer when entity is Answer answer => EnqueueApprovedAnswerNotification(answer),
                ModerationTargetType.Comment when entity is Comment comment => EnqueueApprovedCommentNotification(comment),
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

        private static (string Id, string? Title, string? AuthorId, ModerationStatus Status, string DisplayName, string ActionUrl, NotificationEntityType EntityType)
            GetNotificationTarget(ModerationTargetType targetType, object entity)
        {
            return entity switch
            {
                QAPost post => (post.Id, post.Title, post.AuthorId, post.ModerationStatus, "question", $"/questions/{post.Id}", NotificationEntityType.QUESTION),
                Post post => (post.Id, post.Title, post.AuthorId, post.ModerationStatus, "post", $"/post/{post.Id}", NotificationEntityType.POST),
                Answer answer => (answer.Id, answer.QAPost?.Title ?? "Answer", answer.AuthorId, answer.ModerationStatus, "answer", $"/questions/{answer.QAPostId}#answer-{answer.Id}", NotificationEntityType.POST),
                Comment comment => GetCommentNotificationTarget(comment),
                _ => (string.Empty, null, null, ModerationStatus.Approved, "content", string.Empty, NotificationEntityType.POST)
            };
        }

        private static (string Id, string? Title, string? AuthorId, ModerationStatus Status, string DisplayName, string ActionUrl, NotificationEntityType EntityType)
            GetCommentNotificationTarget(Comment comment)
        {
            var rootPost = comment.Post ?? comment.Answer?.QAPost ?? comment.ReplyToComment?.Post ?? comment.ReplyToComment?.Answer?.QAPost;
            var actionUrl = rootPost is QAPost
                ? $"/questions/{rootPost.Id}#comment-{comment.Id}"
                : $"/post/{rootPost?.Id}#comment-{comment.Id}";

            return (comment.Id, rootPost?.Title ?? "Comment", comment.AuthorId, comment.ModerationStatus, "comment", actionUrl, NotificationEntityType.COMMENT);
        }

        private static string BuildRejectionReason(string? moderatorNote, string? tier2Reasoning, string? queueReason)
        {
            var reason = new[] { moderatorNote, tier2Reasoning, queueReason }
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
                ?.Trim() ?? "Rejected by moderator.";

            return reason.Length <= 1000 ? reason : reason[..1000];
        }

        private sealed class ModerationTarget
        {
            public object Entity { get; }

            public ModerationTarget(object entity)
            {
                Entity = entity;
            }

            public void SetModerationState(ModerationStatus status, string? reason)
            {
                switch (Entity)
                {
                    case Post post:
                        post.ModerationStatus = status;
                        post.ModerationReason = reason;
                        break;
                    case Answer answer:
                        answer.ModerationStatus = status;
                        answer.ModerationReason = reason;
                        break;
                    case Comment comment:
                        comment.ModerationStatus = status;
                        comment.ModerationReason = reason;
                        break;
                }
            }
        }
    }
}
