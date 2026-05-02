using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class AdminPostDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;

        public string ContentPreview { get; set; } = null!;

        public string Slug { get; set; } = null!;
        public PostType PostType { get; set; }
        public string AuthorId { get; set; } = null!;
        public string? AuthorName { get; set; }

        public ModerationStatus ModerationStatus { get; set; }

        public int UpvoteCount { get; set; }
        public int DownvoteCount { get; set; }
        public DateTimeOffset? DateModified { get; set; }

        public DateTimeOffset? DateCreated { get; set; }
    }
}
