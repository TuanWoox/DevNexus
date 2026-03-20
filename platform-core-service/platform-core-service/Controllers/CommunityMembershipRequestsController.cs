using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/community-members")]
    [Authorize]
    public class CommunityMembershipRequestsController(ICommunityMembershipRequestService requestService) : ControllerBase
    {
        private readonly ICommunityMembershipRequestService _requestService = requestService;

        /// <summary>
        /// Cancel a pending membership request for the current user.
        /// </summary>
        [HttpDelete("{communityId}/requests/cancel")]
        public async Task<IActionResult> CancelRequest(string communityId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _requestService.CancelRequest(communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Approve a pending membership request. Owner or moderator only.
        /// </summary>
        [HttpPost("requests/{requestId}/approve")]
        public async Task<IActionResult> ApproveRequest(string requestId)
        {
            var returnResult = new ReturnResult<SelectCommunityMemberDTO>();
            try
            {
                returnResult = await _requestService.ApproveRequestAsync(requestId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Reject a pending membership request. Owner or moderator only.
        /// </summary>
        [HttpPost("requests/{requestId}/reject")]
        public async Task<IActionResult> RejectRequest(string requestId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _requestService.RejectRequestAsync(requestId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Get paginated pending membership requests. Owner or moderator only.
        /// </summary>
        [HttpPost("{communityId}/requests/paging")]
        public async Task<IActionResult> GetPendingRequests(string communityId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>();
            try
            {
                returnResult = await _requestService.GetPendingRequestsAsync(communityId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
