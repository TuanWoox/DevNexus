using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Post : BaseEntity<string>
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
        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
        public PostType PostType { get; set; }

        public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    }
}