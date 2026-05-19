using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostHistory;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IPostHistoryService : IContentHistoryService<Post, PostHistory, PostHistoryDTO>
    {
    }
}
