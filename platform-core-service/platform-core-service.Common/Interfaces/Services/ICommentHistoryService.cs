using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentHistory;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommentHistoryService : IContentHistoryService<Comment, CommentHistory, CommentHistoryDTO>
    {
    }
}
