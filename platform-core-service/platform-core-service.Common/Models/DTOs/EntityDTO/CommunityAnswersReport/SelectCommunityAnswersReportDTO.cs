using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityAnswersReport
{
    public class SelectCommunityAnswersReportDTO : BaseSelectCommunityReportDTO
    {
        public string AnswerId { get; set; } = null!;
        public SelectReportedAnswerDTO? Answer { get; set; }
    }
}
