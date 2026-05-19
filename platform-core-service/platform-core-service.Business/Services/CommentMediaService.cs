using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Services.Base;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentMedia;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommentMediaService : BaseContentMediaService<CommentMedia, SelectCommentMediaDTO>, ICommentMediaService
    {
        public CommentMediaService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ISocialGuardService socialGuardService,
            IConfigurationService configurationService,
            IUserContext userContext,
            IMapper mapper)
            : base(context, cacheService, socialGuardService, configurationService, userContext, mapper)
        {
        }

        protected override DbSet<CommentMedia> DbSet => _context.CommentMedias;
        protected override string MediaFolderName => "comment-media";
        protected override string CacheKeyPrefix => "comment-media-";
        protected override IQueryable<CommentMedia> IncludeNavigation(IQueryable<CommentMedia> query)
            => query.Include(x => x.Comment).ThenInclude(x => x.Post)
                .Include(x => x.Comment).ThenInclude(x => x.Answer).ThenInclude(x => x.QAPost);
        protected override ContentMediaType GetMediaType(CommentMedia entity) => entity.CommentMediaType;
        protected override IQueryable<CommentMedia> GetDuplicateQuery(string sha256Hash, ContentMediaType mediaType)
            => DbSet.IgnoreQueryFilters().Where(x => x.SHA256Hash == sha256Hash && x.CommentMediaType == mediaType);

        protected override CommentMedia CreateEntity(string storeDestination, string sha256Hash, ContentMediaType mediaType)
            => new() { StoreDestination = storeDestination, SHA256Hash = sha256Hash, CommentMediaType = mediaType };
    }
}
