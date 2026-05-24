using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class AdminReportDetailDTO
    {
        public AdminReportDTO Report { get; set; } = null!;
        public object? ReportedVersion { get; set; }
        public object? CurrentTarget { get; set; }
        public ProfileSummaryDTO? Reporter { get; set; }
        public ProfileSummaryDTO? TargetOwner { get; set; }
        public string? TargetSnapshotJson { get; set; }
        public ReportTargetSnapshotDTO? TargetSnapshot { get; set; }
        public AdminReportTargetStateDTO? CurrentTargetState { get; set; }
        public string? ModeratorNote { get; set; }
        public ReportResolution? Resolution { get; set; }
        public string? ResolutionNote { get; set; }
        public string? ResolvedById { get; set; }
        public ProfileSummaryDTO? ResolvedBy { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }
        public ReportTargetAction? TargetAction { get; set; }
    }

    public class AdminReportTargetStateDTO
    {
        public bool Unavailable { get; set; }
        public bool Deleted { get; set; }
        public DateTimeOffset? DeletedAt { get; set; }
        public bool Hidden { get; set; }
        public string? ModerationStatus { get; set; }
        public bool Private { get; set; }
        public bool Suspended { get; set; }
        public DateTimeOffset? SuspendedUntil { get; set; }
        public bool ParentUnavailable { get; set; }
        public bool ParentDeleted { get; set; }
        public bool ParentHidden { get; set; }
        public string? ParentModerationStatus { get; set; }
    }
}
