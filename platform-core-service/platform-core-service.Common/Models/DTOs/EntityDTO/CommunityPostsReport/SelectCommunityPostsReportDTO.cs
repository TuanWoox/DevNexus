using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityPostsReport
{
    public class SelectCommunityPostsReportDTO : BaseSelectCommunityReportDTO
    {
        public string PostId { get; set; } = null!;
        public SelectReportedPostDTO? Post { get; set; }
    }
}
