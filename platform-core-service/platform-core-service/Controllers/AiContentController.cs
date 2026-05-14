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
    public class AiContentController : ControllerBase
    {
        private readonly IAiWorkerClient _aiWorkerClient;

        public AiContentController(IAiWorkerClient aiWorkerClient)
        {
            _aiWorkerClient = aiWorkerClient;
        }

        [HttpPost("metadata")]
        public async Task<IActionResult> SuggestMetadata([FromBody] AIMetadataRequestDTO request)
        {
            ReturnResult<AIMetadataResponseDTO> returnResult = new();
            try
            {
                returnResult = await _aiWorkerClient.SuggestMetadataAsync(request);
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
