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
        public string? ModeratorNote { get; set; }
        public ReportResolution? Resolution { get; set; }
        public string? ResolutionNote { get; set; }
        public string? ResolvedById { get; set; }
        public ProfileSummaryDTO? ResolvedBy { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }
    }
}
