using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(CommunityId), nameof(BannedProfileId), IsUnique = true)]
    public class CommunityBan : BaseKey, ICreated, IModified
    {
        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;

        [JsonIgnore]
        public Community Community { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(BannedProfile))]
        public string BannedProfileId { get; set; } = null!;

        [JsonIgnore]
        [InverseProperty(nameof(Profile.BanRecords))]
        public Profile BannedProfile { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(BannedBy))]
        public string BannedById { get; set; } = null!;

        [JsonIgnore]
        [InverseProperty(nameof(Profile.BansIssued))]
        public Profile BannedBy { get; set; } = null!;

        [StringLength(500)]
        public string? BanReason { get; set; }

        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
