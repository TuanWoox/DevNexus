using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(ModeratorId), nameof(CommunityId), IsUnique = true)]
    public class CommunityModerator : BaseKey, ICreated, IModified
    {
        [Required]
        [ForeignKey(nameof(Moderator))]
        public string ModeratorId { get; set; } = null!;

        [JsonIgnore]
        public Profile Moderator { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;

        [JsonIgnore]
        public Community Community { get; set; } = null!;
        public DateTimeOffset? DateModified { get; set; }
        public DateTimeOffset? DateCreated { get; set; }

    }
}