using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentHistory;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommentHistoryService : BaseContentHistoryService<Comment, CommentHistory, CommentHistoryDTO, SelectCommentDTO>, ICommentHistoryService
    {
        public CommentHistoryService(ApplicationDbContext context, IMapper mapper, IRepository<CommentHistory, string> repository)
            : base(context, mapper, repository)
        {
        }

        protected override DbSet<CommentHistory> GetHistoryDbSet() => _context.CommentHistories;

        protected override async Task<Comment?> GetEntityAsync(string contentId)
        {
            return await _context.Comments
                .Include(c => c.Author)
                .Include(c => c.Replies)
                .FirstOrDefaultAsync(c => c.Id == contentId);
        }

        protected override void SetContentId(CommentHistory history, string contentId)
        {
            history.CommentId = contentId;
        }

        protected override IQueryable<CommentHistory> FilterByContentId(IQueryable<CommentHistory> query, string contentId)
        {
            return query.Where(h => h.CommentId == contentId);
        }
    }
}
