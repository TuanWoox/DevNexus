using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(OwnerId), nameof(BlockedProfileId), IsUnique = true)]
    public class ProfileBlock : BaseEntityHardDelete<string>
    {
        [Required]
        [ForeignKey(nameof(Owner))]
        public string OwnerId { get; set; } = null!;

        [JsonIgnore]
        [InverseProperty(nameof(Profile.BlockRecords))]
        public Profile Owner { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(BlockedProfile))]
        public string BlockedProfileId { get; set; } = null!;

        [JsonIgnore]
        [InverseProperty(nameof(Profile.BlockedByRecords))]
        public Profile BlockedProfile { get; set; } = null!;
    }
}