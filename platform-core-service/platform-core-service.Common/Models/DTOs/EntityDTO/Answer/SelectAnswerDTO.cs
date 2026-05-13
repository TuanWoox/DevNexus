using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Answer
{
    public class SelectAnswerDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string Content { get; set; } = null!;
        public bool IsAccepted { get; set; } = false;
        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
        public string QAPostId { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public SelectAnswerAuthorDTO? Author { get; set; }
        public DateTimeOffset DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public bool? CurrentUserVote { get; set; }
    }

    public class SelectAnswerAuthorDTO
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; }
        public string? AvatarUrl { get; set; }

        public string? BackgroundUrl { get; set; }

        public string Bio { get; set; }

        public int ReputationPoints { get; set; }

        public List<string> TechStacks { get; set; } = new List<string>();

        public bool IsPrivate { get; set; }
    }
}

