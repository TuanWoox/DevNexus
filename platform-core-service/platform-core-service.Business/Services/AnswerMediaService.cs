using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Services.Base;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerMedia;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AnswerMediaService : BaseContentMediaService<AnswerMedia, SelectAnswerMediaDTO>, IAnswerMediaService
    {
        public AnswerMediaService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ISocialGuardService socialGuardService,
            IConfigurationService configurationService,
            IUserContext userContext,
            IMapper mapper)
            : base(context, cacheService, socialGuardService, configurationService, userContext, mapper)
        {
        }

        protected override DbSet<AnswerMedia> DbSet => _context.AnswerMedias;
        protected override string MediaFolderName => "answer-media";
        protected override string CacheKeyPrefix => "answer-media-";
        protected override IQueryable<AnswerMedia> IncludeNavigation(IQueryable<AnswerMedia> query)
            => query.Include(x => x.Answer).ThenInclude(x => x.QAPost);
        protected override PostMediaType GetMediaType(AnswerMedia entity) => entity.AnswerMediaType;
        protected override IQueryable<AnswerMedia> GetDuplicateQuery(string sha256Hash, PostMediaType mediaType)
            => DbSet.IgnoreQueryFilters().Where(x => x.SHA256Hash == sha256Hash && x.AnswerMediaType == mediaType);

        protected override AnswerMedia CreateEntity(string storeDestination, string sha256Hash, PostMediaType mediaType)
            => new() { StoreDestination = storeDestination, SHA256Hash = sha256Hash, AnswerMediaType = mediaType };
    }
}
