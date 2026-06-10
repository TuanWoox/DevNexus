using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Post : BaseEntityVoteValue<string>
    {
        [ForeignKey(nameof(Author))]
        [JsonIgnore]
        public string AuthorId { get; set; }

        [JsonIgnore]
        public Profile Author { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 500 characters")]
        public string Title { get; set; }

        [Required]
        [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
        public string Content { get; set; }

        [StringLength(500, ErrorMessage = "Slug cannot exceed 500 characters")]
        [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string Slug { get; set; }

        [Required]
        [EnumDataType(typeof(PostType), ErrorMessage = "PostType must be a valid Post type")]
        public PostType PostType { get; set; }

        public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();

        public ICollection<BookMarkedItem> BookMarkedStores { get; set; } = [];

        [ForeignKey(nameof(Community))]
        public string? CommunityId { get; set; } = null;
        [JsonIgnore]
        public virtual Community? Community { get; set; }
        [JsonIgnore]
        public List<PostMedia> PostMedias { get; set; } = [];
        [EnumDataType(typeof(ModerationStatus), ErrorMessage = "ModerationStatus must be a valid Moderation type")]
        public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.Pending;

        [StringLength(1000)]
        public string? ModerationReason { get; set; }

        public int ModerationVersion { get; set; } = 0;

        [StringLength(128)]
        public string? ModerationContentHash { get; set; }

        [EnumDataType(typeof(CommunityApprovalStatus), ErrorMessage = "CommunityApprovalStatus must be a valid community approval type")]
        public CommunityApprovalStatus? CommunityApprovalStatus { get; set; } = null;

        [StringLength(1000)]
        public string? CommunityApprovalReason { get; set; }

        [ForeignKey(nameof(SharedPost))]
        public string? SharedPostId { get; set; }

        [JsonIgnore]
        public virtual Post? SharedPost { get; set; }
    }
}
