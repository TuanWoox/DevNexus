using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public abstract class BaseCommunityReport : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;
        public virtual Community Community { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Reporter))]
        public string ReporterId { get; set; } = null!;
        public virtual Profile Reporter { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(ReportedProfile))]
        public string ReportedProfileId { get; set; } = null!;
        public virtual Profile ReportedProfile { get; set; } = null!;

        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = null!;

        [Required]
        public ReportStatus Status { get; set; } = ReportStatus.Pending;

        [ForeignKey(nameof(ResolvedBy))]
        public string? ResolvedById { get; set; }
        public virtual Profile? ResolvedBy { get; set; }

        [StringLength(1000)]
        public string? ResolutionNotes { get; set; }

        public ReportResolutionAction ResolutionAction { get; set; } = ReportResolutionAction.None;
    }
}
