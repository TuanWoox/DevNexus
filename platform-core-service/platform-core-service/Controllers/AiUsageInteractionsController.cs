using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiUsageInteractionsController : ControllerBase
    {
        private readonly IAiWorkerClient _aiWorkerClient;

        public AiUsageInteractionsController(IAiWorkerClient aiWorkerClient)
        {
            _aiWorkerClient = aiWorkerClient;
        }

        [HttpPatch("{usageLogId:int}/interaction")]
        public async Task<IActionResult> UpdateInteraction(
            int usageLogId,
            [FromBody] AIUsageInteractionUpdateRequestDTO request)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _aiWorkerClient.UpdateUsageInteractionAsync(usageLogId, request);
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
