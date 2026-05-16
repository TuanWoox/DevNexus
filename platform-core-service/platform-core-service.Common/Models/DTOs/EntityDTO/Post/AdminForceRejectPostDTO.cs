using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class AdminForceRejectPostDTO
    {
        [Required]
        [MinLength(1)]
        [MaxLength(1000)]
        public string ReasonText { get; set; } = null!;

        [MaxLength(500)]
        public string? ModeratorNote { get; set; }
    }
}
