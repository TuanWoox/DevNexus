using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Services.Base;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostMedia;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class PostMediaService : BaseContentMediaService<PostMedia, SelectPostMediaDTO>, IPostMediaService
    {
        public PostMediaService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ISocialGuardService socialGuardService,
            IConfigurationService configurationService,
            IUserContext userContext,
            IMapper mapper)
            : base(context, cacheService, socialGuardService, configurationService, userContext, mapper)
        {
        }

        protected override DbSet<PostMedia> DbSet => _context.PostMedias;
        protected override string MediaFolderName => "post-media";
        protected override string CacheKeyPrefix => "post-media-";
        protected override IQueryable<PostMedia> IncludeNavigation(IQueryable<PostMedia> query) => query.Include(x => x.Post);
        protected override PostMediaType GetMediaType(PostMedia entity) => entity.PostMediaType;
        protected override IQueryable<PostMedia> GetDuplicateQuery(string sha256Hash, PostMediaType mediaType)
            => DbSet.IgnoreQueryFilters().Where(x => x.SHA256Hash == sha256Hash && x.PostMediaType == mediaType);

        protected override PostMedia CreateEntity(string storeDestination, string sha256Hash, PostMediaType mediaType)
            => new() { StoreDestination = storeDestination, SHA256Hash = sha256Hash, PostMediaType = mediaType };

        public Task<string> GetPostMedia(string Id) => GetMedia(Id);
    }
}
