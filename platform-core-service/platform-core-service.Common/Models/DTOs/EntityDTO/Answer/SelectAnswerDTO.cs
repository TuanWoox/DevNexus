using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Answer
{
    public class SelectAnswerDTO
    {
        public string Id { get; set; } = null!;
        public string Content { get; set; } = null!;
        public bool IsAccepted { get; set; } = false;
        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
        public string QAPostId { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public DateTimeOffset DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
