using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminPostService
    {
        /// <summary>
        /// Returns ALL posts (Post + QAPost, any ModerationStatus) for admin oversight.
        /// Unlike the public feed which filters by Approved only.
        /// </summary>
        Task<ReturnResult<PagedData<AdminPostDTO, string>>> GetAllPostsAsync(Page<string> page);

        /// <summary>
        /// Admin force-approves a post — overrides AI decision.
        /// Sets Post.ModerationStatus = Approved, making it visible in public feed.
        /// </summary>
        Task<ReturnResult<bool>> ForceApproveAsync(string postId);

        /// <summary>
        /// Admin force-flags a post — overrides AI decision.
        /// Sets Post.ModerationStatus = Flagged, keeping it hidden from public feed.
        /// </summary>
        Task<ReturnResult<bool>> ForceRejectAsync(string postId, AdminForceRejectPostDTO dto);
    }
}
