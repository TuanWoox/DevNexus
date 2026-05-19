using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminReportService
    {
        Task<ReturnResult<PagedData<AdminReportDTO, string>>> GetPagingAsync(Page<string> page);
        Task<ReturnResult<AdminReportDetailDTO>> GetByIdAsync(string id);
    }
}
