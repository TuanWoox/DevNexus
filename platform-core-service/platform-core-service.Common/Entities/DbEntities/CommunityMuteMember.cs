using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommunityMuteMember : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;
        public virtual Community Community { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(MutedProfile))]
        public string MutedProfileId { get; set; } = null!;
        public virtual Profile MutedProfile { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(MutedBy))]
        public string MutedById { get; set; } = null!;
        public virtual Profile MutedBy { get; set; } = null!;

        [StringLength(500)]
        public string? MuteReason { get; set; }

        public DateTimeOffset? MutedUntil { get; set; }
    }
}
