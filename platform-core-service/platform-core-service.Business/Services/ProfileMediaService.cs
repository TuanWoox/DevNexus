using AutoMapper;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Abstracts;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ProfileMediaService : BasePrimaryMediaService<ProfileMedia, CreateProfileMediaDTO, UpdatePrimaryProfileMediaDTO, SelectProfileMediaDTO, DisplayProfileMediaDTO>, IProfileMediaService
    {
        private readonly IProfileService _profileService;

        public ProfileMediaService(
            ApplicationDbContext context,
            IMapper mapper,
            IRepository<ProfileMedia, string> repository,
            IConfigurationService configurationService,
            IUserContext userContext,
            ICloudinary cloudinary,
            ICacheService cacheService,
            IProfileService profileService,
            IConfiguration configuration)
            : base(context, mapper, repository, configurationService, userContext, cacheService, configuration)
        {
            _profileService = profileService;
        }

        protected override DbSet<ProfileMedia> DbSet => _context.ProfileMedias;
        protected override string MediaFolderName => "profile-media";
        protected override string CacheKeyPrefix => "profile-media-";
        protected override string ApiBaseUrlSettingKey => "ApiSettings:ProfileMediaBaseUrl";
        protected override string DefaultApiBaseUrl => "http://localhost:5105/api/ProfileMedia";
        protected override IFormFile GetFile(CreateProfileMediaDTO dto) => dto.File;
        protected override string GetOwnerId(CreateProfileMediaDTO dto) => _userContext.ProfileId;
        protected override string GetOwnerId(UpdatePrimaryProfileMediaDTO dto) => _userContext.ProfileId;
        protected override string GetMediaId(UpdatePrimaryProfileMediaDTO dto) => dto.Id;
        protected override IQueryable<ProfileMedia> GetPagingQuery(string ownerId) => DbSet.Where(x => x.ProfileId == ownerId);
        protected override IQueryable<ProfileMedia> GetDuplicateQuery(CreateProfileMediaDTO dto, string sha256Hash)
            => DbSet.IgnoreQueryFilters().Where(x => x.ProfileId == _userContext.ProfileId && x.ProfileMediaType == dto.ProfileMediaType && x.SHA256Hash == sha256Hash);
        protected override IQueryable<ProfileMedia> GetPrimaryQuery(CreateProfileMediaDTO dto)
            => DbSet.Where(x => x.ProfileId == _userContext.ProfileId && x.ProfileMediaType == dto.ProfileMediaType && x.IsPrimary);
        protected override IQueryable<ProfileMedia> GetPrimaryQuery(UpdatePrimaryProfileMediaDTO dto)
            => DbSet.Where(x => x.ProfileId == _userContext.ProfileId && x.ProfileMediaType == dto.ProfileMediaType && x.IsPrimary);
        protected override IQueryable<ProfileMedia> GetUpdatedPrimaryQuery(UpdatePrimaryProfileMediaDTO dto)
            => DbSet.Where(x => x.ProfileId == _userContext.ProfileId && x.Id == dto.Id && x.ProfileMediaType == dto.ProfileMediaType);
        protected override ProfileMedia CreateEntity(CreateProfileMediaDTO dto, string fileDestination, string sha256Hash)
            => new() { ProfileId = _userContext.ProfileId, IsPrimary = true, StoreDestination = fileDestination, ProfileMediaType = dto.ProfileMediaType, SHA256Hash = sha256Hash };
        protected override Task<ReturnResult<bool>> ValidateOwnership(string ownerId)
            => Task.FromResult(new ReturnResult<bool> { Result = ownerId == _userContext.ProfileId, Message = "You do not have permission to manage this media" });
        protected override Task OnPrimaryChanged(ProfileMedia media)
            => _profileService.UpdateProfileImageUrl(media.ProfileId, media.Id, media.ProfileMediaType);
        protected override Task OnPrimaryDeleted(ProfileMedia media)
            => _profileService.UpdateProfileImageUrl(media.ProfileId, "", media.ProfileMediaType);

        public Task<ReturnResult<PagedData<DisplayProfileMediaDTO, string>>> GetPaging(string ProfileId, Page<string> page, ProfileMediaType profileMediaType = ProfileMediaType.Avatar)
        {
            var query = DbSet.Where(x => x.ProfileId == ProfileId && x.ProfileMediaType == profileMediaType);
            return GetProfilePaging(query, page);
        }

        private async Task<ReturnResult<PagedData<DisplayProfileMediaDTO, string>>> GetProfilePaging(IQueryable<ProfileMedia> query, Page<string> page)
        {
            var result = await _repository.GetPagingAsync<Page<string>, SelectProfileMediaDTO>(query.OrderByDescending(x => x.IsPrimary).AsNoTracking(), page);
            var returnResult = new ReturnResult<PagedData<DisplayProfileMediaDTO, string>>();
            if (result.Data.Any())
            {
                var baseUrl = _configuration[ApiBaseUrlSettingKey] ?? DefaultApiBaseUrl;
                returnResult.Result = new PagedData<DisplayProfileMediaDTO, string>(result.Page)
                {
                    Data = result.Data.Select(x => new DisplayProfileMediaDTO { Id = x.Id, Url = $"{baseUrl}/{x.Id}" }).ToList()
                };
            }
            return returnResult;
        }
    }
}
