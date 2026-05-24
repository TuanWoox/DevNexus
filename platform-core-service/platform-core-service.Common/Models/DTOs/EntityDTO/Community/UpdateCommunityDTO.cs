using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Community
{
    public class UpdateCommunityDTO
    {
        [Required]
        public string Id { get; set; } = null!;

        [StringLength(256, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 256 characters")]
        public string? Name { get; set; }

        [StringLength(5000, ErrorMessage = "Description cannot exceed 5000 characters")]
        public string? Description { get; set; }

        [StringLength(500, ErrorMessage = "Cover photo URL cannot exceed 500 characters")]
        [Url(ErrorMessage = "CommunityCoverPhotoUrl must be a valid URL")]
        public string? CommunityCoverPhotoUrl { get; set; }

        [StringLength(200, ErrorMessage = "Slug cannot exceed 200 characters")]
        [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug must be lowercase with hyphens only")]
        public string? Slug { get; set; }

        public bool? IsPrivate { get; set; }

        public bool? RequireContentApproval { get; set; }
    }
}
