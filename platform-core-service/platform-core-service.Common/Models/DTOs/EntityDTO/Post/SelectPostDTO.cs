using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class SelectPostDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;

        public string Title { get; set; } = null!;

        public string Content { get; set; } = null!;

        public string Slug { get; set; } = null!;

        public PostType PostType { get; set; }

        public ModerationStatus ModerationStatus { get; set; }

        public string? ModerationReason { get; set; }

        public string AuthorId { get; set; } = null!;

        public SelectPostAuthorDTO? Author { get; set; }

        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
        public int CommentCount { get; set; } = 0;

        public List<string> TagNames { get; set; } = new List<string>();

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset? DateModified { get; set; }
        public bool? CurrentUserVote { get; set; }

        public string? CommunityId { get; set; }
        public SelectPostCommunityDTO? Community { get; set; }
    }

    public class SelectPostAuthorDTO
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public List<string> TechStacks { get; set; } = new List<string>();
    }

    public class SelectPostCommunityDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? CommunityCoverPhotoUrl { get; set; }
    }
}
