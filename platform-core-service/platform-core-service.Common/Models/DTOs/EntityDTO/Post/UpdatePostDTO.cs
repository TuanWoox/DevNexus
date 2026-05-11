using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class UpdatePostDTO
    {
        [Required]
        public string Id { get; set; } = null!;

        [StringLength(500, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 500 characters")]
        public string? Title { get; set; }

        [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
        public string? Content { get; set; }

        [EnumDataType(typeof(PostType), ErrorMessage = "PostType must be a valid Post type")]
        public PostType? PostType { get; set; }

        [StringLength(500, ErrorMessage = "Slug cannot exceed 500 characters")]
        [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string? Slug { get; set; }

        public List<string>? TagNames { get; set; }

        /// <summary>
        /// Optional: Community ID to move/associate this post with a community.
        /// If provided, the service validates the user belongs to that community.
        /// </summary>
        public string? CommunityId { get; set; }

        // Optional: IDs of pre-uploaded media to link to this post on update
        public List<string>? MediaIds { get; set; }
    }
}
