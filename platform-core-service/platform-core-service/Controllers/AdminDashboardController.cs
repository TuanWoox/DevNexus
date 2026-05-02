using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Returns a snapshot of platform health metrics for the admin console.
    /// All endpoints require the Admin role.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _dashboardService;

        public AdminDashboardController(IAdminDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// GET api/admindashboard
        /// Returns platform-wide counts: posts by status, queue depth, user count, top tags.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            ReturnResult<AdminDashboardDTO> returnResult = new();
            try
            {
                returnResult = await _dashboardService.GetDashboardAsync();
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
