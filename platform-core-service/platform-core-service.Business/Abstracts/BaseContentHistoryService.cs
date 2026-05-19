using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Data;
using System.Text.Json;

namespace platform_core_service.Business.Abstracts
{
    public abstract class BaseContentHistoryService<TEntity, THistory, THistoryDTO, TSnapshotDTO> : IContentHistoryService<TEntity, THistory, THistoryDTO>
        where TEntity : class
        where THistory : BaseEntity<string>, new()
        where THistoryDTO : class, IBaseKey<string>
        where TSnapshotDTO : class
    {
        protected readonly ApplicationDbContext _context;
        protected readonly IMapper _mapper;
        protected readonly IRepository<THistory, string> _repository;

        protected BaseContentHistoryService(
            ApplicationDbContext context,
            IMapper mapper,
            IRepository<THistory, string> repository)
        {
            _context = context;
            _mapper = mapper;
            _repository = repository;
        }

        protected abstract DbSet<THistory> GetHistoryDbSet();
        protected abstract Task<TEntity?> GetEntityAsync(string contentId);
        protected abstract void SetContentId(THistory history, string contentId);
        protected abstract IQueryable<THistory> FilterByContentId(IQueryable<THistory> query, string contentId);

        public async Task<THistory> RecordHistoryAsync(string contentId)
        {
            var entity = await GetEntityAsync(contentId);
            if (entity == null)
            {
                throw new ArgumentException($"Entity with ID {contentId} not found");
            }

            var history = new THistory
            {
                Id = Guid.NewGuid().ToString()
            };
            typeof(THistory).GetProperty("ContentSnapshot")?.SetValue(
                history,
                JsonSerializer.Serialize(_mapper.Map<TSnapshotDTO>(entity)));
            SetContentId(history, contentId);

            GetHistoryDbSet().Add(history);
            await _context.SaveChangesAsync();

            return history;
        }

        public async Task<PagedData<THistoryDTO, string>> GetHistoryAsync(string contentId, Page<string> page)
        {
            var query = FilterByContentId(GetHistoryDbSet().AsNoTracking(), contentId);
            if (page.Orders == null || page.Orders.Count == 0)
            {
                query = query.OrderByDescending(h => h.DateCreated);
            }

            return await _repository.GetPagingAsync<Page<string>, THistoryDTO>(query, page);
        }

        public async Task<THistoryDTO?> GetVersionAsync(string historyId)
        {
            var history = await GetHistoryDbSet()
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.Id == historyId);

            return history == null ? null : _mapper.Map<THistoryDTO>(history);
        }
    }
}
