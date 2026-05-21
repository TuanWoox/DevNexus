namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class ReportTargetSnapshotDTO
    {
        public string? TargetTitle { get; set; }
        public string? TargetPreview { get; set; }
        public string? TargetOwnerDisplayName { get; set; }
        public string? TargetOwnerAvatarUrl { get; set; }
        public string? Route { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public bool IsDeletedAtReportTime { get; set; }
    }
}
