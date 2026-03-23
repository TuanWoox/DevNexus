using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class UserFollow : BaseEntityHardDelete<string>
    {
        [Required]
        [ForeignKey(nameof(Owner))]
        public string OwnerId { get; set; } = null!;
        [InverseProperty(nameof(Profile.Following))]
        [JsonIgnore]
        public Profile Owner { get; set; } = null!;
        [ForeignKey(nameof(FollowingProfile))]
        [Required]
        public string FollowingProfileId { get; set; } = null!;
        [InverseProperty(nameof(Profile.Followers))]
        [JsonIgnore]
        public Profile FollowingProfile { get; set; } = null!;
    }
}