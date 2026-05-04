using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Admin and Moderator endpoint for human review of AI-escalated posts.
    /// Tier 3 of the 3-tier moderation pipeline.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminModerationController : ControllerBase
    {
        private readonly IAdminModerationService _adminModerationService;

        public AdminModerationController(
            IAdminModerationService adminModerationService)
        {
            _adminModerationService = adminModerationService;
        }

        /// <summary>
        /// POST api/adminmoderation/paging
        /// Returns paged list of unresolved queue entries (ResolvedAt IS NULL).
        /// Each entry includes the flagged post's title, content and author for review.
        /// </summary>
        [HttpPost("paging")]
        public async Task<IActionResult> GetPendingQueue([FromBody] Page<string> page)
        {
            ReturnResult<PagedData<AdminQueueEntryDTO, string>> returnResult = new();
            try
            {
                returnResult = await _adminModerationService.GetPendingQueueAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminmoderation/approve
        /// Admin approves an escalated post — post becomes Approved and visible in feed.
        /// </summary>
        [HttpPost("approve")]
        public async Task<IActionResult> Approve([FromBody] AdminQueueResolveDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminModerationService.ApproveAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminmoderation/reject
        /// Admin rejects an escalated post — post stays hidden (Flagged status).
        /// </summary>
        [HttpPost("reject")]
        public async Task<IActionResult> Reject([FromBody] AdminQueueResolveDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminModerationService.RejectAsync(dto);
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
