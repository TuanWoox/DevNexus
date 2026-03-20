using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/community-members")]
    [Authorize]
    public class CommunityMembersController : ControllerBase
    {
        private readonly ICommunityMemberService _communityMemberService;

        public CommunityMembersController(ICommunityMemberService communityMemberService)
        {
            _communityMemberService = communityMemberService;
        }

        /// <summary>
        /// Join a community. Public → added directly. Private → pending request created.
        /// </summary>
        [HttpPost("{communityId}/join")]
        public async Task<IActionResult> Join(string communityId)
        {
            var returnResult = new ReturnResult<object>();
            try
            {
                returnResult = await _communityMemberService.JoinAsync(communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Leave a community. The community owner cannot leave.
        /// </summary>
        [HttpDelete("{communityId}/leave")]
        public async Task<IActionResult> Leave(string communityId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _communityMemberService.LeaveAsync(communityId);
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
                returnResult = await _communityMemberService.ApproveRequestAsync(requestId);
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
                returnResult = await _communityMemberService.RejectRequestAsync(requestId);
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
                returnResult = await _communityMemberService.GetPendingRequestsAsync(communityId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Get paginated members of a community. Public.
        /// </summary>
        [HttpPost("{communityId}/members/paging")]
        public async Task<IActionResult> GetMembers(string communityId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityMemberDTO, string>>();
            try
            {
                returnResult = await _communityMemberService.GetMembersAsync(communityId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Ban a member. Owner or moderator only. Also removes the member record.
        /// </summary>
        [HttpPost("bans")]
        public async Task<IActionResult> BanMember([FromBody] CreateCommunityBanDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityBanDTO>();
            try
            {
                returnResult = await _communityMemberService.BanMemberAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Unban a member by ban record ID. Owner or moderator only.
        /// </summary>
        [HttpDelete("bans/{banId}")]
        public async Task<IActionResult> UnbanMember(string banId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _communityMemberService.UnbanMemberAsync(banId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Get paginated ban records for a community. Owner or moderator only.
        /// </summary>
        [HttpPost("{communityId}/bans/paging")]
        public async Task<IActionResult> GetBans(string communityId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityBanDTO, string>>();
            try
            {
                returnResult = await _communityMemberService.GetBansAsync(communityId, page);
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
