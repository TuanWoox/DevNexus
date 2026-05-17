using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Services.Base;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityMediaService : BasePrimaryMediaService<CommunityMedia, CreateCommunityMediaDTO, UpdatePrimaryCommunityMediaDTO, SelectCommunityMediaDTO, DisplayCommunityMediaDTO>, ICommunityMediaService
    {
        private readonly ICommunityService _communityService;

        public CommunityMediaService(
            ApplicationDbContext context,
            IMapper mapper,
            IRepository<CommunityMedia, string> repository,
            IConfigurationService configurationService,
            IUserContext userContext,
            ICacheService cacheService,
            ICommunityService communityService,
            IConfiguration configuration)
            : base(context, mapper, repository, configurationService, userContext, cacheService, configuration)
        {
            _communityService = communityService;
        }

        protected override DbSet<CommunityMedia> DbSet => _context.CommunityMedias;
        protected override string MediaFolderName => "community-media";
        protected override string CacheKeyPrefix => "community-media-";
        protected override string ApiBaseUrlSettingKey => "ApiSettings:CommunityMediaBaseUrl";
        protected override string DefaultApiBaseUrl => "https://localhost:7184/api/CommunityMedia";
        protected override IFormFile GetFile(CreateCommunityMediaDTO dto) => dto.File;
        protected override string GetOwnerId(CreateCommunityMediaDTO dto) => dto.CommunityId;
        protected override string GetOwnerId(UpdatePrimaryCommunityMediaDTO dto) => dto.CommunityId;
        protected override string GetMediaId(UpdatePrimaryCommunityMediaDTO dto) => dto.Id;
        protected override IQueryable<CommunityMedia> GetPagingQuery(string ownerId) => DbSet.Where(x => x.CommunityId == ownerId);
        protected override IQueryable<CommunityMedia> GetDuplicateQuery(CreateCommunityMediaDTO dto, string sha256Hash)
            => DbSet.IgnoreQueryFilters().Where(x => x.CommunityId == dto.CommunityId && x.SHA256Hash == sha256Hash);
        protected override IQueryable<CommunityMedia> GetPrimaryQuery(CreateCommunityMediaDTO dto)
            => DbSet.Where(x => x.CommunityId == dto.CommunityId && x.IsPrimary);
        protected override IQueryable<CommunityMedia> GetPrimaryQuery(UpdatePrimaryCommunityMediaDTO dto)
            => DbSet.Where(x => x.CommunityId == dto.CommunityId && x.IsPrimary);
        protected override IQueryable<CommunityMedia> GetUpdatedPrimaryQuery(UpdatePrimaryCommunityMediaDTO dto)
            => DbSet.Where(x => x.CommunityId == dto.CommunityId && x.Id == dto.Id);
        protected override CommunityMedia CreateEntity(CreateCommunityMediaDTO dto, string fileDestination, string sha256Hash)
            => new() { CommunityId = dto.CommunityId, IsPrimary = true, StoreDestination = fileDestination, SHA256Hash = sha256Hash };
        protected override async Task<ReturnResult<bool>> ValidateOwnership(string ownerId)
        {
            var result = new ReturnResult<bool>();
            var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == ownerId);
            if (community == null) result.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community", ownerId);
            else if (community.OwnerId != _userContext.ProfileId) result.Message = "You do not have permission to manage this community's media";
            else result.Result = true;
            return result;
        }
        protected override Task OnPrimaryChanged(CommunityMedia media)
            => _communityService.UpdateCommunityCoverPhotoUrl(media.CommunityId, media.Id);
        protected override Task OnPrimaryDeleted(CommunityMedia media)
            => _communityService.UpdateCommunityCoverPhotoUrl(media.CommunityId, "");
    }
}
