using Hangfire;
using Microsoft.EntityFrameworkCore;
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

        public AdminModerationService(
            ApplicationDbContext context,
            IUserContext userContext,
            IRepository<ModerationQueueEntry, string> queueRepository,
            IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _userContext = userContext;
            _queueRepository = queueRepository;
            _backgroundJobClient = backgroundJobClient;
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
                // Only unresolved entries (ResolvedAt IS NULL) — i.e. waiting for human action
                var query = _context.ModerationQueueEntries
                    .Where(e => e.ResolvedAt == null)
                    .Include(e => e.Post)
                        .ThenInclude(p => p.Author)
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

        public async Task<ReturnResult<bool>> ApproveAsync(AdminQueueResolveDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }
                var adminId = _userContext.ProfileId;

                // Step 1: Load entry with its linked post + Kéo theo cả Author và Tags
                var entry = await _context.ModerationQueueEntries
                    .Include(e => e.Post)
                        .ThenInclude(p => p.Author) // <--- Phải kéo Author lên để lấy FullName
                    .Include(e => e.Post)
                        .ThenInclude(p => p.PostTags)
                            .ThenInclude(pt => pt.Tag) // <--- Phải kéo Tag lên để lấy Name
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entry == null)
                {
                    result.Message = $"Queue entry {dto.Id} not found";
                    return result;
                }

                // Step 2: Guard — already resolved
                if (entry.ResolvedAt.HasValue)
                {
                    result.Message = $"Queue entry {dto.Id} is already resolved ({entry.Resolution})";
                    return result;
                }

                // Step 3: Resolve the queue entry
                entry.Resolution = "Approved";
                entry.ResolvedAt = DateTimeOffset.UtcNow;
                entry.AssignedModeratorId = adminId;
                entry.ModeratorNote = dto.ModeratorNote?.Trim();

                // Step 4: Update post to Approved — makes it visible in feed
                entry.Post.ModerationStatus = ModerationStatus.Approved;
                entry.Post.ModerationReason = null;

                await _context.SaveChangesAsync();

                // Gán entry.Post vào biến post để xài cho gọn và hết lỗi đỏ
                var post = entry.Post;
                EnqueueModerationNotification(post);

                if (post is QAPost)
                {
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

                    DevNexusLogger.Instance.Debug($"[AdminModeration] AI Task queued for QA Post {post.Id}");
                }
                else
                {
                    DevNexusLogger.Instance.Debug($"[AdminModeration] Skipped AI Task for non-QA Post {post.Id}");
                }
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while approving queue entry: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> RejectAsync(AdminQueueResolveDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }
                var adminId = _userContext.ProfileId;
                // Step 1: Load entry with its linked post
                var entry = await _context.ModerationQueueEntries
                    .Include(e => e.Post)
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entry == null)
                {
                    result.Message = $"Queue entry {dto.Id} not found";
                    return result;
                }

                // Step 2: Guard — already resolved
                if (entry.ResolvedAt.HasValue)
                {
                    result.Message = $"Queue entry {dto.Id} is already resolved ({entry.Resolution})";
                    return result;
                }

                // Step 3: Resolve the queue entry
                entry.Resolution = "Rejected";
                entry.ResolvedAt = DateTimeOffset.UtcNow;
                entry.AssignedModeratorId = adminId;
                entry.ModeratorNote = dto.ModeratorNote?.Trim();

                // Step 4: Update post to Flagged — keeps it hidden from feed
                entry.Post.ModerationStatus = ModerationStatus.Flagged;
                entry.Post.ModerationReason = BuildRejectionReason(dto.ModeratorNote, entry.Tier2Reasoning, entry.Reason);

                await _context.SaveChangesAsync();
                EnqueueModerationNotification(entry.Post);

                DevNexusLogger.Instance.Debug(
                    $"[AdminModeration] Entry {dto.Id} rejected by admin {adminId} for post {entry.PostId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while rejecting queue entry: {ex.Message}";
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

        private static string BuildRejectionReason(string? moderatorNote, string? tier2Reasoning, string? queueReason)
        {
            var reason = new[] { moderatorNote, tier2Reasoning, queueReason }
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
                ?.Trim() ?? "Rejected by moderator.";

            return reason.Length <= 1000 ? reason : reason[..1000];
        }
    }
}
