using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiKeyAuth] // ✅ Secured with API Key — only accessible by microservices
    public class MicroserviceSyncController : ControllerBase
    {
        private readonly IMicroserviceSyncService _microserviceSyncService;

        public MicroserviceSyncController(IMicroserviceSyncService microserviceSyncService)
        {
            _microserviceSyncService = microserviceSyncService;
        }

        // ✅ COUNT - check if sync is needed
        [HttpGet("profiles/count")]
        public async Task<IActionResult> GetProfilesCount()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                returnResult = await _microserviceSyncService.GetProfilesCountAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        // ✅ PAGING - sync profiles (filters out IDs in selected array)
        [HttpPost("profiles/paging")]
        public async Task<IActionResult> GetProfilesSnapshot([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<ProfileSyncDTO, string>>();
            try
            {
                returnResult = await _microserviceSyncService.GetProfilesSnapshotAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpGet("profile-blocks/count")]
        public async Task<IActionResult> GetProfileBlocksCount()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                returnResult = await _microserviceSyncService.GetProfileBlocksCountAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("profile-blocks/paging")]
        public async Task<IActionResult> GetProfileBlocksSnapshot([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<ProfileBlockSyncDTO, string>>();
            try
            {
                returnResult = await _microserviceSyncService.GetProfileBlocksSnapshotAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpGet("user-follows/count")]
        public async Task<IActionResult> GetUserFollowsCount()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                returnResult = await _microserviceSyncService.GetUserFollowsCountAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("user-follows/paging")]
        public async Task<IActionResult> GetUserFollowsSnapshot([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<UserFollowSyncDTO, string>>();
            try
            {
                returnResult = await _microserviceSyncService.GetUserFollowsSnapshotAsync(page);
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
