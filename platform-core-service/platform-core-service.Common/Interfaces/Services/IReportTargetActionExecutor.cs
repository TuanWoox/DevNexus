using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IReportTargetActionExecutor
    {
        Task<ReturnResult<bool>> ExecuteAsync(
            ModerationReport report,
            ReportTargetAction action,
            ResolveReportDTO dto);
    }
}
