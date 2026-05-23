using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Community : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Owner))]
        public string OwnerId { get; set; } = null!;

        [JsonIgnore]
        public Profile Owner { get; set; } = null!;

        [Required]
        [StringLength(256, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 256 characters")]
        public string Name { get; set; } = null!;

        [StringLength(5000, ErrorMessage = "Description cannot exceed 5000 characters")]
        public string? Description { get; set; }

        [StringLength(500, ErrorMessage = "Cover photo URL cannot exceed 500 characters")]
        [Url(ErrorMessage = "CommunityCoverPhotoUrl must be a valid URL")]
        public string? CommunityCoverPhotoUrl { get; set; }

        [StringLength(200, ErrorMessage = "Slug cannot exceed 200 characters")]
        [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string Slug { get; set; } = null!;

        public bool IsPrivate { get; set; } = false;

        public bool RequireContentApproval { get; set; } = false;

        [JsonIgnore]
        public ICollection<CommunityModerator> Moderators { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityMember> Members { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityMembershipRequest> MembershipRequests { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityBan> Bans { get; set; } = [];
        [JsonIgnore]
        public ICollection<Post> Posts { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityMedia> CommunityMedias { get; set; } = [];
    }
}
