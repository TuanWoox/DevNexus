using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminReportsController : ControllerBase
    {
        private readonly IAdminReportService _adminReportService;

        public AdminReportsController(IAdminReportService adminReportService)
        {
            _adminReportService = adminReportService;
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetPaging([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<AdminReportDTO, string>>();
            try
            {
                returnResult = await _adminReportService.GetPagingAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var returnResult = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                returnResult = await _adminReportService.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            if (returnResult.Result == null)
            {
                return NotFound(returnResult);
            }

            return Ok(returnResult);
        }

        [HttpPost("{id}/assign-to-me")]
        public async Task<IActionResult> AssignToMe(string id, [FromBody] AssignReportDTO dto)
        {
            var returnResult = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                returnResult = await _adminReportService.AssignToMeAsync(id, dto ?? new AssignReportDTO());
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("{id}/resolve")]
        public async Task<IActionResult> Resolve(string id, [FromBody] ResolveReportDTO dto)
        {
            var returnResult = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                returnResult = await _adminReportService.ResolveAsync(id, dto ?? new ResolveReportDTO());
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("{id}/dismiss")]
        public async Task<IActionResult> Dismiss(string id, [FromBody] DismissReportDTO dto)
        {
            var returnResult = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                returnResult = await _adminReportService.DismissAsync(id, dto ?? new DismissReportDTO());
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("{id}/escalate")]
        public async Task<IActionResult> Escalate(string id, [FromBody] EscalateReportDTO dto)
        {
            var returnResult = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                returnResult = await _adminReportService.EscalateAsync(id, dto ?? new EscalateReportDTO());
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
