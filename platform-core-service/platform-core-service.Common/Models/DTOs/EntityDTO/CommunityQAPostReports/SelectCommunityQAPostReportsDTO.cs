using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityQAPostReports
{
    public class SelectCommunityQAPostReportsDTO : BaseSelectCommunityReportDTO
    {
        public string QAPostId { get; set; } = null!;
        public SelectReportedQAPostDTO? QAPost { get; set; }
    }
}
