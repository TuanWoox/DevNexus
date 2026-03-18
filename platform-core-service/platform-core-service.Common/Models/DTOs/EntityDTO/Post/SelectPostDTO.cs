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

        public string AuthorId { get; set; } = null!;

        public List<string> TagNames { get; set; } = new List<string>();

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset? DateModified { get; set; }
    }
}
