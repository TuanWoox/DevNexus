namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport
{
    public class SelectReportedPostDTO
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string ContentPreview { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public DateTimeOffset? DateCreated { get; set; }
    }

    public class SelectReportedQAPostDTO : SelectReportedPostDTO
    {
    }

    public class SelectReportedAnswerDTO
    {
        public string Id { get; set; } = null!;
        public string ContentPreview { get; set; } = null!;
        public string QAPostId { get; set; } = null!;
        public string? QAPostTitle { get; set; }
        public string AuthorId { get; set; } = null!;
        public DateTimeOffset? DateCreated { get; set; }
    }

    public class SelectReportedCommentDTO
    {
        public string Id { get; set; } = null!;
        public string ContentPreview { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public string? PostId { get; set; }
        public string? PostTitle { get; set; }
        public string? AnswerId { get; set; }
        public string? QAPostId { get; set; }
        public string? QAPostTitle { get; set; }
        public string? ReplyToCommentId { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
