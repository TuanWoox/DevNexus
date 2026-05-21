using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityContentReportService
    {
        Task<ReturnResult<bool>> ReportContent(string communityId, ReportContentDTO reportContentDTO);

        Task<ReturnResult<PagedData<TReportDTO, string>>> GetPagingDataForAdminAndModerator<TReportDTO>(Page<string> page, string communityId)
            where TReportDTO : IBaseKey<string>;

        Task<ReturnResult<PagedData<TReportDTO, string>>> GetPagingDataForCurrentUser<TReportDTO>(Page<string> page, string communityId)
            where TReportDTO : IBaseKey<string>;

        Task<ReturnResult<bool>> ResolveReport(string communityId, ResolveReportDTO resolveDTO);
    }
}
