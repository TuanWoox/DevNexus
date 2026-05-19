using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPostHistory;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IQAPostHistoryService : IContentHistoryService<QAPost, QAPostHistory, QAPostHistoryDTO>
    {
    }
}
