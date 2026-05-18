using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommentMedia
{
    public class SelectCommentMediaDTO : BaseMediaEntity<string>
    {
        public string? CommentId { get; set; }
        public ContentMediaType CommentMediaType { get; set; }
    }
}
