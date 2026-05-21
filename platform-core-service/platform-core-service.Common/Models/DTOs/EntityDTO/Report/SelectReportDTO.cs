using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class SelectReportDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public ReportTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public ReportReason Reason { get; set; }
        public ReportStatus Status { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
