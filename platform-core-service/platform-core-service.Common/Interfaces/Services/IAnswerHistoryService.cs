using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerHistory;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAnswerHistoryService : IContentHistoryService<Answer, AnswerHistory, AnswerHistoryDTO>
    {
    }
}
