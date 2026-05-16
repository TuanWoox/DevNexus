using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

using Hangfire;

namespace platform_core_service.Business.Services
{
    public class AdminPostService : IAdminPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IRepository<PostEntity, string> _postRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IUserContext _userContext;

        public AdminPostService(
            ApplicationDbContext context,
            IRepository<PostEntity, string> postRepository,
            IBackgroundJobClient backgroundJobClient,
            IUserContext userContext)
        {
            _context = context;
            _postRepository = postRepository;
            _backgroundJobClient = backgroundJobClient;
            _userContext = userContext;
        }

        public async Task<ReturnResult<PagedData<AdminPostDTO, string>>> GetAllPostsAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminPostDTO, string>>();
            try
            {
                // Admin sees ALL posts — no ModerationStatus filter, no type filter.
                // IgnoreQueryFilters so soft-deleted posts are also visible if needed.
                var query = _context.Posts
                    .IgnoreQueryFilters()
                    .Include(p => p.Author)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _postRepository.GetPagingAsync<Page<string>, AdminPostDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving posts: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> ForceApproveAsync(string postId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .Include(p => p.Author)
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                post.ModerationStatus = ModerationStatus.Approved;
                post.ModerationReason = null;
                await ResolveOpenQueueEntryAsync(post.Id, "Approved", null);
                await _context.SaveChangesAsync();

                // Build DTO for AI First Responder
                if (post is QAPost) // Thay QAPost bằng tên entity QA của bác (ví dụ: QaPostEntity)
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

                    DevNexusLogger.Instance.Debug($"[AdminPost] AI Task queued for QA Post {post.Id}");
                }
                else
                {
                    DevNexusLogger.Instance.Debug($"[AdminPost] Post {postId} force-approved");
                }

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while approving post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> ForceRejectAsync(string postId, AdminForceRejectPostDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var reasonText = dto?.ReasonText?.Trim();
                if (string.IsNullOrWhiteSpace(reasonText))
                {
                    result.Message = "ReasonText is required";
                    return result;
                }

                if (reasonText.Length > 1000)
                {
                    result.Message = "ReasonText cannot exceed 1000 characters";
                    return result;
                }

                var moderatorNote = dto?.ModeratorNote?.Trim();
                if (moderatorNote?.Length > 500)
                {
                    result.Message = "ModeratorNote cannot exceed 500 characters";
                    return result;
                }

                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                // Flagged = hidden from public feed (same as human-reject in Phase 1)
                post.ModerationStatus = ModerationStatus.Flagged;
                post.ModerationReason = reasonText;
                await ResolveOpenQueueEntryAsync(post.Id, "Rejected", moderatorNote);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug($"[AdminPost] Post {postId} force-flagged");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while rejecting post: {ex.Message}";
            }
            return result;
        }

        private async Task ResolveOpenQueueEntryAsync(string postId, string resolution, string? moderatorNote)
        {
            var entry = await _context.ModerationQueueEntries
                .FirstOrDefaultAsync(e => e.PostId == postId && e.ResolvedAt == null);

            if (entry == null) return;

            entry.AssignedModeratorId = _userContext.ProfileId;
            entry.Resolution = resolution;
            entry.ResolvedAt = DateTimeOffset.UtcNow;
            entry.ModeratorNote = moderatorNote;
        }
    }
}
