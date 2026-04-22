using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Internal endpoints consumed exclusively by the AI Worker.
    /// Protected by InternalApiKeyMiddleware — no JWT required.
    /// </summary>
    [ApiController]
    [Route("internal/moderation")]
    public class InternalModerationController : ControllerBase
    {
        private readonly IModerationService _moderationService;

        public InternalModerationController(IModerationService moderationService)
        {
            _moderationService = moderationService;
        }

        /// <summary>
        /// POST /internal/moderation/callback
        /// Called by AI Worker after the 3-tier pipeline completes.
        /// Updates Post.ModerationStatus and creates a PostModerationResult audit row.
        /// </summary>
        [HttpPost("callback")]
        public async Task<IActionResult> Callback([FromBody] ModerationCallbackDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _moderationService.HandleCallbackAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST /internal/moderation/queue
        /// Called by AI Worker (Tier 3 only) to enqueue a post for human review.
        /// Returns the generated ModerationQueueEntry ID.
        /// </summary>
        [HttpPost("queue")]
        public async Task<IActionResult> Queue([FromBody] ModerationQueueRequestDTO dto)
        {
            var returnResult = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                returnResult = await _moderationService.EnqueueForReviewAsync(dto);
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
