using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Answer
{
    public class CreateAnswerDTO
    {
        [Required]
        [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
        public string Content { get; set; } = null!;
        
        [Required]
        public string QAPostId { get; set; } = null!;
    }
}
