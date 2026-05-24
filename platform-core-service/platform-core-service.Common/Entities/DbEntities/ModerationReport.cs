using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class ModerationReport : BaseEntity<string>
    {
        [Required]
        [MaxLength(450)]
        public string ReporterId { get; set; } = null!;

        [Required]
        public ReportTargetType TargetType { get; set; }

        [Required]
        [MaxLength(450)]
        public string TargetId { get; set; } = null!;

        [Required]
        [MaxLength(450)]
        public string TargetOwnerId { get; set; } = null!;

        [MaxLength(450)]
        public string? TargetHistoryId { get; set; }

        [Column(TypeName = "jsonb")]
        public string? TargetSnapshotJson { get; set; }

        [Required]
        public ReportReason Reason { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public ReportStatus Status { get; set; } = ReportStatus.Pending;

        [MaxLength(450)]
        public string? AssignedModeratorId { get; set; }

        [MaxLength(1000)]
        public string? ModeratorNote { get; set; }

        public ReportResolution? Resolution { get; set; }

        public ReportTargetAction? TargetAction { get; set; }

        [MaxLength(1000)]
        public string? ResolutionNote { get; set; }

        [MaxLength(450)]
        public string? ResolvedById { get; set; }

        public DateTimeOffset? ResolvedAt { get; set; }
    }
}
