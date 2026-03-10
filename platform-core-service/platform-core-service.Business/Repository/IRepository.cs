using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Model.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Business.Repository
{
    public interface IRepository<TEntity, TKey> where TEntity : class, IBaseKey<TKey>
    {
        public Task<ReturnResult<TEntity>> GetByIdAsync(TKey id);
        public Task<PagedData<TResponse, TKey>> GetPagingAsync<TPage, TResponse>(IQueryable<TEntity> entities, TPage page, bool isExport = false)
            where TResponse : IBaseKey<TKey>
            where TPage : Page<TKey>;
        public Task<ReturnResult<TEntity>> CreateAsync<TCreateDto>(TCreateDto entity)
        where TCreateDto : class, IBaseKey<TKey>;
        public Task<ReturnResult<TEntity>> UpdateAsync<TUpdateDto>(TUpdateDto entity)
            where TUpdateDto : class, IBaseKey<TKey>;
        public Task<ReturnResult<bool>> DeleteByIdAsync(TKey id);
        public Task<ReturnResult<int>> DeleteByIdsAsync(List<TKey> ids);
    }
}