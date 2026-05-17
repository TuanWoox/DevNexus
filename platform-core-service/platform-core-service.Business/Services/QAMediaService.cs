using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Services.Base;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAMedia;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class QAMediaService : BaseContentMediaService<QAMedia, SelectQAMediaDTO>, IQAMediaService
    {
        public QAMediaService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ISocialGuardService socialGuardService,
            IConfigurationService configurationService,
            IUserContext userContext,
            IMapper mapper)
            : base(context, cacheService, socialGuardService, configurationService, userContext, mapper)
        {
        }

        protected override DbSet<QAMedia> DbSet => _context.QAMedias;
        protected override string MediaFolderName => "qa-media";
        protected override string CacheKeyPrefix => "qa-media-";
        protected override IQueryable<QAMedia> IncludeNavigation(IQueryable<QAMedia> query) => query.Include(x => x.QAPost);
        protected override PostMediaType GetMediaType(QAMedia entity) => entity.QAMediaType;
        protected override IQueryable<QAMedia> GetDuplicateQuery(string sha256Hash, PostMediaType mediaType)
            => DbSet.IgnoreQueryFilters().Where(x => x.SHA256Hash == sha256Hash && x.QAMediaType == mediaType);

        protected override QAMedia CreateEntity(string storeDestination, string sha256Hash, PostMediaType mediaType)
            => new() { StoreDestination = storeDestination, SHA256Hash = sha256Hash, QAMediaType = mediaType };

        public Task<string> GetQAMedia(string Id) => GetMedia(Id);
    }
}
