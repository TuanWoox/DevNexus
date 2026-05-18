using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Answer
{
    public class UpdateAnswerDTO
    {
        [Required]
        public string Id { get; set; } = null!;
        [Required]
        [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
        public string Content { get; set; } = null!;

        public List<string>? MediaIds { get; set; }
    }
}
