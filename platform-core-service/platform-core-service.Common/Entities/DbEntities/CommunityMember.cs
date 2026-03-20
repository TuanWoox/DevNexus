using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(CommunityId), nameof(ProfileId), IsUnique = true)]
    public class CommunityMember : BaseKey, ICreated, IModified
    {
        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;

        [JsonIgnore]
        public Community Community { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Profile))]
        public string ProfileId { get; set; } = null!;

        [JsonIgnore]
        public Profile Profile { get; set; } = null!;

        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
