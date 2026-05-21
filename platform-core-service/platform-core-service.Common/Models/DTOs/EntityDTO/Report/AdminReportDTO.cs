using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class AdminReportDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public ReportTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public string? TargetHistoryId { get; set; }
        public ReportReason Reason { get; set; }
        public string? DescriptionPreview { get; set; }
        public ReportStatus Status { get; set; }
        public ProfileSummaryDTO? Reporter { get; set; }
        public ProfileSummaryDTO? TargetOwner { get; set; }
        public string? TargetTitle { get; set; }
        public string? TargetPreview { get; set; }
        public string? TargetRoute { get; set; }
        public string? AssignedModeratorId { get; set; }
        public ProfileSummaryDTO? AssignedModerator { get; set; }
        public ReportResolution? Resolution { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public bool IsStaffSensitive { get; set; }
        public ReportTargetAction? TargetAction { get; set; }
    }
}
