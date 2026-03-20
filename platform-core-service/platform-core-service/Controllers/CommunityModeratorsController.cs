using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommunityModeratorsController : ControllerBase
    {
        private readonly ICommunityModeratorService _communityModeratorService;

        public CommunityModeratorsController(ICommunityModeratorService communityModeratorService)
        {
            _communityModeratorService = communityModeratorService;
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] CreateCommunityModeratorDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityModeratorDTO>();
            try
            {
                returnResult = await _communityModeratorService.AddAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _communityModeratorService.RemoveAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("{communityId}/paging")]
        public async Task<IActionResult> GetByCommunity(string communityId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityModeratorDTO, string>>();
            try
            {
                returnResult = await _communityModeratorService.GetByCommunityAsync(communityId, page);
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
