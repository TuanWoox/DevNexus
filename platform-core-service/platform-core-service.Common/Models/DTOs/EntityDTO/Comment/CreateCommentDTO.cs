using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Comment
{
    public class CreateCommentDTO
    {
        [Required]
        [StringLength(5000, MinimumLength = 1, ErrorMessage = "Comment content must be between 1 and 5000 characters")]
        public string Content { get; set; } = null!;

        public string? PostId { get; set; }

        public string? AnswerId { get; set; }

        public string? ReplyToCommentId { get; set; }

        public List<string> MediaIds { get; set; } = new();
    }
}
