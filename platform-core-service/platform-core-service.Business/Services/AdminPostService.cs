using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Helper;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Services
{
    public class AdminPostService : IAdminPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IRepository<PostEntity, string> _postRepository;
        private readonly IUserContext _userContext;
        private readonly IAdminAuditLogService _adminAuditLogService;
        private readonly IQAPostFirstResponderTriggerService _firstResponderTriggerService;

        public AdminPostService(
            ApplicationDbContext context,
            IRepository<PostEntity, string> postRepository,
            IUserContext userContext,
            IAdminAuditLogService adminAuditLogService,
            IQAPostFirstResponderTriggerService firstResponderTriggerService)
        {
            _context = context;
            _postRepository = postRepository;
            _userContext = userContext;
            _adminAuditLogService = adminAuditLogService;
            _firstResponderTriggerService = firstResponderTriggerService;
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

                var oldState = new
                {
                    moderationStatus = post.ModerationStatus.ToString(),
                    post.ModerationReason
                };
                post.ModerationStatus = ModerationStatus.Approved;
                post.ModerationReason = null;
                await ResolveOpenQueueEntryAsync(post.Id, "Approved", null);
                await _adminAuditLogService.AddAsync(AdminAuditLogFactory.ForPostAction(
                    AuditActionType.PostForceApproved,
                    post.Id,
                    post.Title,
                    oldState,
                    new
                    {
                        moderationStatus = post.ModerationStatus.ToString(),
                        post.ModerationReason
                    }));
                await _context.SaveChangesAsync();
                if (post is QAPost)
                {
                    await _firstResponderTriggerService.TryEnqueueAsync(post.Id, "AdminPost");
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

                var oldState = new
                {
                    moderationStatus = post.ModerationStatus.ToString(),
                    post.ModerationReason
                };

                // Flagged = hidden from public feed (same as human-reject in Phase 1)
                post.ModerationStatus = ModerationStatus.Flagged;
                post.ModerationReason = reasonText;
                await ResolveOpenQueueEntryAsync(post.Id, "Rejected", moderatorNote);
                await _adminAuditLogService.AddAsync(AdminAuditLogFactory.ForPostAction(
                    AuditActionType.PostForceRejected,
                    post.Id,
                    post.Title,
                    oldState,
                    new
                    {
                        moderationStatus = post.ModerationStatus.ToString(),
                        post.ModerationReason
                    },
                    publicReason: reasonText,
                    internalNote: moderatorNote));
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
            var openEntries = await _context.ModerationQueueEntries
                .Where(e => e.TargetType == ModerationTargetType.Post &&
                            e.TargetId == postId &&
                            e.ResolvedAt == null)
                .ToListAsync();

            if (openEntries.Count == 0) return;

            var resolvedAt = DateTimeOffset.UtcNow;
            foreach (var entry in openEntries)
            {
                entry.AssignedModeratorId = _userContext.ProfileId;
                entry.Resolution = resolution;
                entry.ResolvedAt = resolvedAt;
                entry.ModeratorNote = moderatorNote;
            }
        }
    }
}
