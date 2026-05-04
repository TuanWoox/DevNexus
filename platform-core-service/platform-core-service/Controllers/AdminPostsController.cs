using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Admin and Moderator endpoint for content oversight.
    /// Allows admins and moderators to view ALL posts (any ModerationStatus) and
    /// manually override AI moderation decisions.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminPostsController : ControllerBase
    {
        private readonly IAdminPostService _adminPostService;

        public AdminPostsController(IAdminPostService adminPostService)
        {
            _adminPostService = adminPostService;
        }

        /// <summary>
        /// POST api/adminposts/paging
        /// Returns paged list of ALL posts (Post + QAPost, any ModerationStatus).
        /// Use filters on the Page object to narrow by status, type, author, etc.
        /// </summary>
        [HttpPost("paging")]
        public async Task<IActionResult> GetAllPosts([FromBody] Page<string> page)
        {
            ReturnResult<PagedData<AdminPostDTO, string>> returnResult = new();
            try
            {
                returnResult = await _adminPostService.GetAllPostsAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminposts/{id}/approve
        /// Force-approves a post — overrides any AI decision.
        /// Post immediately becomes visible in the public feed.
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ForceApprove(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminPostService.ForceApproveAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminposts/{id}/reject
        /// Force-flags a post — overrides any AI decision.
        /// Post is hidden from public feed (ModerationStatus = Flagged).
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> ForceReject(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminPostService.ForceRejectAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
