using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/community-mute")]
    [Authorize]
    public class CommunityMuteController(ICommunityMuteService muteService) : ControllerBase
    {
        private readonly ICommunityMuteService _muteService = muteService;

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
    }
}
