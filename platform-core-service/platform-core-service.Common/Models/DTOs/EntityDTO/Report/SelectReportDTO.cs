using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class SelectReportDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string ReporterId { get; set; } = null!;
        public ReportTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public string TargetOwnerId { get; set; } = null!;
        public string? TargetHistoryId { get; set; }
        public string? TargetSnapshotJson { get; set; }
        public ReportReason Reason { get; set; }
        public string? Description { get; set; }
        public ReportStatus Status { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
