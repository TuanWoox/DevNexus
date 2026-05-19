using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Abstracts
{
    public abstract class BasePrimaryMediaService<TEntity, TCreateDto, TUpdateDto, TSelectDto, TDisplayDto>
        where TEntity : class, IPrimaryMedia, new()
        where TSelectDto : class, IBaseKey<string>
        where TDisplayDto : class, new()
    {
        protected readonly ApplicationDbContext _context;
        protected readonly IMapper _mapper;
        protected readonly IRepository<TEntity, string> _repository;
        protected readonly IConfigurationService _configurationService;
        protected readonly IUserContext _userContext;
        protected readonly ICacheService _cacheService;
        protected readonly IConfiguration _configuration;

        protected BasePrimaryMediaService(
            ApplicationDbContext context,
            IMapper mapper,
            IRepository<TEntity, string> repository,
            IConfigurationService configurationService,
            IUserContext userContext,
            ICacheService cacheService,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _repository = repository;
            _configurationService = configurationService;
            _userContext = userContext;
            _cacheService = cacheService;
            _configuration = configuration;
        }

        protected abstract DbSet<TEntity> DbSet { get; }
        protected abstract string MediaFolderName { get; }
        protected abstract string CacheKeyPrefix { get; }
        protected abstract string ApiBaseUrlSettingKey { get; }
        protected abstract string DefaultApiBaseUrl { get; }
        protected abstract IFormFile GetFile(TCreateDto dto);
        protected abstract string GetOwnerId(TCreateDto dto);
        protected abstract string GetOwnerId(TUpdateDto dto);
        protected abstract string GetMediaId(TUpdateDto dto);
        protected abstract IQueryable<TEntity> GetPagingQuery(string ownerId);
        protected abstract IQueryable<TEntity> GetDuplicateQuery(TCreateDto dto, string sha256Hash);
        protected abstract IQueryable<TEntity> GetPrimaryQuery(TCreateDto dto);
        protected abstract IQueryable<TEntity> GetPrimaryQuery(TUpdateDto dto);
        protected abstract IQueryable<TEntity> GetUpdatedPrimaryQuery(TUpdateDto dto);
        protected abstract TEntity CreateEntity(TCreateDto dto, string fileDestination, string sha256Hash);
        protected abstract Task<ReturnResult<bool>> ValidateOwnership(string ownerId);
        protected abstract Task OnPrimaryChanged(TEntity media);
        protected abstract Task OnPrimaryDeleted(TEntity media);

        public virtual async Task<string> GetById(string id)
        {
            try
            {
                var cacheFileDestination = await _cacheService.GetCacheAsync<string>($"{CacheKeyPrefix}{id}");
                if (!string.IsNullOrEmpty(cacheFileDestination)) return cacheFileDestination;

                var media = await DbSet.FirstOrDefaultAsync(x => x.Id == id);
                if (media == null) return "";

                await _cacheService.SetCacheAsync($"{CacheKeyPrefix}{id}", media.StoreDestination, HelperUtils.CacheEntryOptions);
                return media.StoreDestination;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                return "";
            }
        }

        public virtual async Task<ReturnResult<PagedData<TDisplayDto, string>>> GetPaging(string ownerId, Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<TDisplayDto, string>>();
            try
            {
                var query = GetPagingQuery(ownerId).OrderByDescending(x => x.IsPrimary).AsNoTracking();
                var pagingResult = await _repository.GetPagingAsync<Page<string>, TSelectDto>(query, page);
                if (pagingResult.Data.Any())
                {
                    var baseUrl = _configuration[ApiBaseUrlSettingKey] ?? DefaultApiBaseUrl;
                    returnResult.Result = new PagedData<TDisplayDto, string>(pagingResult.Page)
                    {
                        Data = pagingResult.Data.Select(x => CreateDisplayDto(x, baseUrl)).ToList()
                    };
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        public virtual async Task<ReturnResult<TSelectDto>> Create(TCreateDto dto)
        {
            var returnResult = new ReturnResult<TSelectDto>();
            string fileDestination = "";

            try
            {
                var file = GetFile(dto);
                if (!file.HasValidImageExtension())
                {
                    returnResult.Message = "Image extension not allow";
                    return returnResult;
                }

                var ownerId = GetOwnerId(dto);
                var ownership = await ValidateOwnership(ownerId);
                if (!ownership.Result)
                {
                    returnResult.Message = ownership.Message;
                    return returnResult;
                }

                fileDestination = await BuildFinalDestination(file.FileName, ownerId);
                string sha256Hash = await HelperUtils.HashFileAsync(file);
                var sameHashMedia = await GetDuplicateQuery(dto, sha256Hash).FirstOrDefaultAsync();

                if (sameHashMedia != null)
                {
                    if (sameHashMedia.Deleted)
                    {
                        sameHashMedia.Deleted = false;
                        sameHashMedia.DateDeleted = null;
                    }
                    else if (sameHashMedia.IsPrimary)
                    {
                        returnResult.Result = _mapper.Map<TSelectDto>(sameHashMedia);
                        await _cacheService.SetCacheAsync($"{CacheKeyPrefix}{sameHashMedia.Id}", sameHashMedia.StoreDestination, HelperUtils.CacheEntryOptions);
                        await OnPrimaryChanged(sameHashMedia);
                        return returnResult;
                    }

                    sameHashMedia.IsPrimary = true;
                }
                else
                {
                    using var stream = new FileStream(fileDestination, FileMode.Create);
                    await file.CopyToAsync(stream);
                }

                var primaryMedia = await GetPrimaryQuery(dto).FirstOrDefaultAsync();
                if (primaryMedia != null) primaryMedia.IsPrimary = false;

                var savedMedia = sameHashMedia;
                if (savedMedia == null)
                {
                    savedMedia = CreateEntity(dto, fileDestination, sha256Hash);
                    await DbSet.AddAsync(savedMedia);
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<TSelectDto>(savedMedia);
                    await OnPrimaryChanged(savedMedia);
                    if (!string.IsNullOrEmpty(primaryMedia?.Id)) await _cacheService.RemoveCacheAsync($"{CacheKeyPrefix}{primaryMedia.Id}");
                }
                else
                {
                    if (File.Exists(fileDestination)) File.Delete(fileDestination);
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                }
            }
            catch (Exception ex)
            {
                if (File.Exists(fileDestination)) File.Delete(fileDestination);
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        public virtual async Task<ReturnResult<TSelectDto>> UpdatePrimary(TUpdateDto dto)
        {
            var returnResult = new ReturnResult<TSelectDto>();
            try
            {
                var ownerId = GetOwnerId(dto);
                var ownership = await ValidateOwnership(ownerId);
                if (!ownership.Result)
                {
                    returnResult.Message = ownership.Message;
                    return returnResult;
                }

                var primaryMedia = await GetPrimaryQuery(dto).FirstOrDefaultAsync();
                var mediaId = GetMediaId(dto);
                if (primaryMedia != null)
                {
                    if (primaryMedia.Id == mediaId)
                    {
                        returnResult.Message = "This image is already set as primary";
                        return returnResult;
                    }
                    primaryMedia.IsPrimary = false;
                }

                var updatedPrimaryMedia = await GetUpdatedPrimaryQuery(dto).FirstOrDefaultAsync();
                if (updatedPrimaryMedia == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "media", mediaId);
                    return returnResult;
                }

                updatedPrimaryMedia.IsPrimary = true;
                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<TSelectDto>(updatedPrimaryMedia);
                    await OnPrimaryChanged(updatedPrimaryMedia);
                    await _cacheService.SetCacheAsync($"{CacheKeyPrefix}{updatedPrimaryMedia.Id}", updatedPrimaryMedia.StoreDestination, HelperUtils.CacheEntryOptions);
                    if (primaryMedia != null) await _cacheService.RemoveCacheAsync($"{CacheKeyPrefix}{primaryMedia.Id}");
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        public virtual async Task<ReturnResult<bool>> Delete(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                var media = await DbSet.FirstOrDefaultAsync(x => x.Id == id);
                if (media == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "media", id);
                    return returnResult;
                }

                var ownership = await ValidateOwnership(media.GetOwnerId());
                if (!ownership.Result)
                {
                    returnResult.Message = ownership.Message;
                    return returnResult;
                }

                _context.Remove(media);
                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;
                    await _cacheService.RemoveCacheAsync($"{CacheKeyPrefix}{media.Id}");
                    if (media.IsPrimary) await OnPrimaryDeleted(media);
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        public virtual async Task<ReturnResult<int>> BulkDelete(List<string> ids)
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                var medias = await DbSet.Where(x => ids.Contains(x.Id)).ToListAsync();
                if (medias.Count == 0)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ALL_ITEM_NOT_FOUND);
                    return returnResult;
                }

                foreach (var ownerId in medias.Select(x => x.GetOwnerId()).Distinct())
                {
                    var ownership = await ValidateOwnership(ownerId);
                    if (!ownership.Result)
                    {
                        returnResult.Message = ownership.Message;
                        return returnResult;
                    }
                }

                _context.RemoveRange(medias);
                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = medias.Count;
                    await Task.WhenAll(medias.Select(x => _cacheService.RemoveCacheAsync($"{CacheKeyPrefix}{x.Id}")));
                    await Task.WhenAll(medias.Where(x => x.IsPrimary).Select(OnPrimaryDeleted));
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        protected virtual TDisplayDto CreateDisplayDto(TSelectDto selectDto, string baseUrl)
        {
            var displayDto = new TDisplayDto();
            typeof(TDisplayDto).GetProperty("Id")?.SetValue(displayDto, selectDto.Id);
            typeof(TDisplayDto).GetProperty("Url")?.SetValue(displayDto, $"{baseUrl}/{selectDto.Id}");
            return displayDto;
        }

        private async Task<string> BuildFinalDestination(string fileName, string ownerId)
        {
            var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
            if (string.IsNullOrEmpty(rootUploadFolder)) rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";

            string mediaFolder = Path.Combine(rootUploadFolder, MediaFolderName, ownerId);
            Directory.CreateDirectory(mediaFolder);
            return Path.Combine(mediaFolder, $"{Guid.NewGuid()}{Path.GetExtension(fileName)}");
        }
    }
}
