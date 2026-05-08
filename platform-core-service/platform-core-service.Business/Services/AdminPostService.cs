using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
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

        public AdminPostService(
            ApplicationDbContext context,
            IRepository<PostEntity, string> postRepository)
        {
            _context = context;
            _postRepository = postRepository;
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
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                post.ModerationStatus = ModerationStatus.Approved;
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug($"[AdminPost] Post {postId} force-approved");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while approving post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> ForceRejectAsync(string postId)
        {
            var result = new ReturnResult<bool>();
            try
            {
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
    }
}
