using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/community-members")]
    [Authorize]
    public class CommunityBansController(ICommunityBanService banService) : ControllerBase
    {
        private readonly ICommunityBanService _banService = banService;

        /// <summary>
        /// Ban a member. Owner or moderator only. Also removes the member record.
        /// </summary>
        [HttpPost("bans")]
        public async Task<IActionResult> BanMember([FromBody] CreateCommunityBanDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityBanDTO>();
            try
            {
                returnResult = await _banService.BanMemberAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Check if a target profile is banned from the specified community.
        /// </summary>
        [HttpGet("{communityId}/bans/profiles/{targetProfileId}")]
        public async Task<IActionResult> GetProfileBanStatus(string communityId, string targetProfileId)
        {
            var returnResult = new ReturnResult<SelectCommunityBanDTO>();
            try
            {
                returnResult = await _banService.GetProfileBanStatusAsync(communityId, targetProfileId);
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
                returnResult = await _banService.UnbanMemberAsync(banId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Unban a target profile from a community. Owner or moderator only.
        /// </summary>
        [HttpDelete("{communityId}/bans/profiles/{targetProfileId}")]
        public async Task<IActionResult> UnbanProfile(string communityId, string targetProfileId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _banService.UnbanProfileAsync(communityId, targetProfileId);
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
                returnResult = await _banService.GetBansAsync(communityId, page);
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
