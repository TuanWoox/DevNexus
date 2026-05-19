using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class PostHistoryService : BaseContentHistoryService<Post, PostHistory, PostHistoryDTO, SelectPostDTO>, IPostHistoryService
    {
        public PostHistoryService(ApplicationDbContext context, IMapper mapper, IRepository<PostHistory, string> repository)
            : base(context, mapper, repository)
        {
        }

        protected override DbSet<PostHistory> GetHistoryDbSet() => _context.PostHistories;

        protected override async Task<Post?> GetEntityAsync(string contentId)
        {
            return await _context.Posts
                .Where(p => p.GetType() == typeof(Post))
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(p => p.Id == contentId);
        }

        protected override void SetContentId(PostHistory history, string contentId)
        {
            history.PostId = contentId;
        }

        protected override IQueryable<PostHistory> FilterByContentId(IQueryable<PostHistory> query, string contentId)
        {
            return query.Where(h => h.PostId == contentId);
        }
    }
}
