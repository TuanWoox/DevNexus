using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AiUsageLogsController : ControllerBase
    {
        private readonly IAiUsageLogService _aiUsageLogService;
        public AiUsageLogsController(IAiUsageLogService aiUsageLogService)
        {
            _aiUsageLogService = aiUsageLogService;
        }
        
        [HttpPost("paging")]
        public async Task<IActionResult> GetLogs([FromBody] Page<string> page)
        {
            ReturnResult<AiUsageLogPageResponseDTO> returnResult = new();
            try
            {
                returnResult = await _aiUsageLogService.GetLogsAsync(page);
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
