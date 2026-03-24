namespace platform_core_service.Common.Models.DTOs.EntityDTO.Comment
{
    public class CommentFilterDTO
    {
        public string? PostId { get; set; }

        public string? AnswerId { get; set; }

        public bool RepliesOnly { get; set; } = false;
    }
}
