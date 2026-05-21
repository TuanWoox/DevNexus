using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IReportService
    {
        Task<ReturnResult<SelectReportDTO>> CreateAsync(CreateReportDTO dto);
    }
}
