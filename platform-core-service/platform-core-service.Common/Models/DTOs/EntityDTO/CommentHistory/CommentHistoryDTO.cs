using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommentHistory
{
    public class CommentHistoryDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommentId { get; set; } = null!;
        public SelectCommentDTO? Content { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
