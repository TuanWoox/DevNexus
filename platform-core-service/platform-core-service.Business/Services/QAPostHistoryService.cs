using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPostHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class QAPostHistoryService : BaseContentHistoryService<QAPost, QAPostHistory, QAPostHistoryDTO, SelectQAPostDTO>, IQAPostHistoryService
    {
        public QAPostHistoryService(ApplicationDbContext context, IMapper mapper, IRepository<QAPostHistory, string> repository)
            : base(context, mapper, repository)
        {
        }

        protected override DbSet<QAPostHistory> GetHistoryDbSet() => _context.QAPostHistories;

        protected override async Task<QAPost?> GetEntityAsync(string contentId)
        {
            return await _context.Posts
                .OfType<QAPost>()
                .Include(q => q.Answers)
                .Include(q => q.Author)
                .Include(q => q.Community)
                .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(q => q.Id == contentId);
        }

        protected override void SetContentId(QAPostHistory history, string contentId)
        {
            history.QAPostId = contentId;
        }

        protected override IQueryable<QAPostHistory> FilterByContentId(IQueryable<QAPostHistory> query, string contentId)
        {
            return query.Where(h => h.QAPostId == contentId);
        }
    }
}
