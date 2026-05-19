using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerHistory;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AnswerHistoryService : BaseContentHistoryService<Answer, AnswerHistory, AnswerHistoryDTO, SelectAnswerDTO>, IAnswerHistoryService
    {
        public AnswerHistoryService(ApplicationDbContext context, IMapper mapper, IRepository<AnswerHistory, string> repository)
            : base(context, mapper, repository)
        {
        }

        protected override DbSet<AnswerHistory> GetHistoryDbSet() => _context.AnswerHistories;

        protected override async Task<Answer?> GetEntityAsync(string contentId)
        {
            return await _context.Answers
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Id == contentId);
        }

        protected override void SetContentId(AnswerHistory history, string contentId)
        {
            history.AnswerId = contentId;
        }

        protected override IQueryable<AnswerHistory> FilterByContentId(IQueryable<AnswerHistory> query, string contentId)
        {
            return query.Where(h => h.AnswerId == contentId);
        }
    }
}
