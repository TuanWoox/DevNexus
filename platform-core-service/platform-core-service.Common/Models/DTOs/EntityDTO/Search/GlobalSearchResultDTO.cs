using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Search
{
    public class GlobalSearchResultDTO
    {
        public List<SearchPostResultDTO> Posts { get; set; } = [];
        public List<SearchQAPostResultDTO> QAPosts { get; set; } = [];
        public List<SearchCommunityResultDTO> Communities { get; set; } = [];
        public List<SearchProfileResultDTO> Profiles { get; set; } = [];
    }

    public class SearchPostAuthorDTO
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? BackgroundUrl { get; set; }
        public string Bio { get; set; } = string.Empty;
        public int ReputationPoints { get; set; }
        public List<string> TechStacks { get; set; } = [];
        public bool IsPrivate { get; set; }
    }

    public class SearchPostResultDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public SearchPostAuthorDTO? Author { get; set; }
        public int UpvoteCount { get; set; }
        public int CommentCount { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public string? CommunityId { get; set; }
        public string? CommunityName { get; set; }
    }

    public class SearchQAPostResultDTO : SearchPostResultDTO
    {
        public int AnswerCount { get; set; }
    }

    public class SearchCommunityResultDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string Slug { get; set; } = null!;
        public string? CommunityCoverPhotoUrl { get; set; }
        public int MemberCount { get; set; }
        public bool IsPrivate { get; set; }
    }

    public class SearchProfileResultDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string Bio { get; set; } = string.Empty;
        public int ReputationPoints { get; set; }
        public List<string> TechStacks { get; set; } = [];
        public bool IsPrivate { get; set; }
    }
}
