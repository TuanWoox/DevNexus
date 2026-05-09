using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminDashboardService
    {
        Task<ReturnResult<AdminDashboardDTO>> GetDashboardAsync();
    }
}
