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
    public class CommunityMembersController(ICommunityMemberService memberService) : ControllerBase
    {
        private readonly ICommunityMemberService _memberService = memberService;

        /// <summary>
        /// Join a community. Public → added directly. Private → pending request created.
        /// </summary>
        [HttpPost("{communityId}/join")]
        public async Task<IActionResult> Join(string communityId)
        {
            var returnResult = new ReturnResult<object>();
            try
            {
                returnResult = await _memberService.JoinAsync(communityId);
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
                returnResult = await _memberService.LeaveAsync(communityId);
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
                returnResult = await _memberService.GetMembersAsync(communityId, page);
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
