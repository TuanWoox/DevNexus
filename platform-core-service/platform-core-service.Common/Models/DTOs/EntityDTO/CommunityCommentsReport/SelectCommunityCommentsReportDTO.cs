using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityCommentsReport
{
    public class SelectCommunityCommentsReportDTO : BaseSelectCommunityReportDTO
    {
        public string CommentId { get; set; } = null!;
        public SelectReportedCommentDTO? Comment { get; set; }
    }
}
