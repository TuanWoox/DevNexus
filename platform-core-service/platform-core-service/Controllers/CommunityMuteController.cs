using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using System;
using System.Threading.Tasks;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/community-mute")]
    [Authorize]
    public class CommunityMuteController(ICommunityMuteService muteService) : ControllerBase
    {
        private readonly ICommunityMuteService _muteService = muteService;

        /// <summary>
        /// Check if the currently logged in user is muted in the specified community.
        /// </summary>
        [HttpGet("{communityId}")]
        public async Task<IActionResult> GetMuteStatus(string communityId)
        {
            var returnResult = new ReturnResult<MuteStatusDTO>();
            try
            {
                returnResult = await _muteService.GetMuteStatusAsync(communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        /// <summary>
        /// Check if a target profile is muted in the specified community.
        /// </summary>
        [HttpGet("{communityId}/profiles/{targetProfileId}")]
        public async Task<IActionResult> GetProfileMuteStatus(string communityId, string targetProfileId)
        {
            var returnResult = new ReturnResult<MuteStatusDTO>();
            try
            {
                returnResult = await _muteService.GetProfileMuteStatusAsync(communityId, targetProfileId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        /// <summary>
        /// Mute a community member. Owner or moderator only.
        /// </summary>
        [HttpPost("mutes")]
        public async Task<IActionResult> MuteMember([FromBody] CreateCommunityMuteDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityMuteDTO>();
            try
            {
                returnResult = await _muteService.MuteMemberAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Unmute a community member by mute record ID. Owner or moderator only.
        /// </summary>
        [HttpDelete("mutes/{muteId}")]
        public async Task<IActionResult> UnmuteMember(string muteId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _muteService.UnmuteMemberAsync(muteId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Unmute a target profile in a community. Owner or moderator only.
        /// </summary>
        [HttpDelete("{communityId}/profiles/{targetProfileId}")]
        public async Task<IActionResult> UnmuteProfile(string communityId, string targetProfileId)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _muteService.UnmuteProfileAsync(communityId, targetProfileId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// Get paginated mute records for a community. Owner or moderator only.
        /// </summary>
        [HttpPost("{communityId}/mutes/paging")]
        public async Task<IActionResult> GetMutedMembers(string communityId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityMuteDTO, string>>();
            try
            {
                returnResult = await _muteService.GetMutedMembersAsync(communityId, page);
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
