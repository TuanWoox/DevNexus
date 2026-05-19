using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IContentHistoryService<TEntity, THistory, THistoryDTO>
        where TEntity : class
        where THistory : BaseEntity<string>
        where THistoryDTO : class, IBaseKey<string>
    {
        Task<THistory> RecordHistoryAsync(string contentId);
        Task<PagedData<THistoryDTO, string>> GetHistoryAsync(string contentId, Page<string> page);
        Task<THistoryDTO?> GetVersionAsync(string historyId);
    }
}
