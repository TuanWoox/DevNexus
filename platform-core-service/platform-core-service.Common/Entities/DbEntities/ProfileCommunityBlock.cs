using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(ProfileId), nameof(CommunityId), IsUnique = true)]
    public class ProfileCommunityBlock : BaseEntityHardDelete<string>
    {
        [Required]
        [ForeignKey(nameof(Profile))]
        public string ProfileId { get; set; } = null!;

        [JsonIgnore]
        [InverseProperty(nameof(Profile.BlockedCommunities))]
        public Profile Profile { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;

        [JsonIgnore]
        public Community Community { get; set; } = null!;
    }
}
