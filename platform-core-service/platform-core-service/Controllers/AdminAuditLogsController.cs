using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminAuditLogsController : ControllerBase
    {
        private readonly IAdminAuditLogService _adminAuditLogService;

        public AdminAuditLogsController(IAdminAuditLogService adminAuditLogService)
        {
            _adminAuditLogService = adminAuditLogService;
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetPaging([FromBody] Page<string> page)
        {
            ReturnResult<PagedData<AdminAuditLogDTO, string>> returnResult = new();
            try
            {
                returnResult = await _adminAuditLogService.GetPagingAsync(page);
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
