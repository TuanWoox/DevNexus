using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace platform_core_service.Business.Services
{
    public class CommunityMediaService(
        ApplicationDbContext context,
        IMapper mapper,
        IRepository<CommunityMedia, string> repository,
        IConfigurationService configurationService,
        IUserContext userContext,
        ICacheService cacheService,
        ICommunityService communityService
    ) : ICommunityMediaService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<CommunityMedia, string> _repository = repository;
        private readonly IConfigurationService _configurationService = configurationService;
        private readonly bool isWindow = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
        private readonly IUserContext _userContext = userContext;
        private readonly ICacheService _cacheService = cacheService;
        private readonly ICommunityService _communityService = communityService;
        private readonly DistributedCacheEntryOptions cacheEntryOptions = new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(30) };

        public async Task<string> GetById([TrimmedRequired] string Id)
        {
            string fileDestination = "";
            string? cacheFileDestination = "";
            try
            {
                cacheFileDestination = await _cacheService.GetCacheAsync<string>($"community-media-{Id}");
                if (!string.IsNullOrEmpty(cacheFileDestination))
                {
                    return cacheFileDestination;
                }
                else
                {
                    CommunityMedia? communityMedia = await _context.CommunityMedias.FirstOrDefaultAsync(x => x.Id == Id);
                    if (communityMedia != null)
                    {
                        fileDestination = communityMedia.StoreDestination;
                        await _cacheService.SetCacheAsync($"community-media-{Id}", communityMedia.StoreDestination, new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(30) });
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return fileDestination;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityMediaDTO, string>>> GetPaging([TrimmedRequired] string communityId, Page<string> page)
        {
            ReturnResult<PagedData<SelectCommunityMediaDTO, string>> returnResult = new();
            try
            {
                var query = _context.CommunityMedias.Where(x => x.CommunityId == communityId).OrderByDescending(x => x.IsPrimary).AsQueryable().AsNoTracking();
                var pagingResult = await _repository.GetPagingAsync<Page<string>, SelectCommunityMediaDTO>(query, page);
                returnResult.Result = pagingResult;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<SelectCommunityMediaDTO>> Create(CreateCommunityMediaDTO createCommunityMedia)
        {
            ReturnResult<SelectCommunityMediaDTO> returnResult = new();
            string fileDestination = "";
            CommunityMedia? newCommunityMedia = null;
            try
            {
                //Guard: check image extension
                if (!createCommunityMedia.File.HasValidImageExtension())
                {
                    returnResult.Message = "Image extension not allow";
                    return returnResult;
                }

                //Guard: verify community ownership
                var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == createCommunityMedia.CommunityId);
                if (community == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community", createCommunityMedia.CommunityId);
                    return returnResult;
                }
                if (community.OwnerId != _userContext.ProfileId)
                {
                    returnResult.Message = "You do not have permission to manage this community's media";
                    return returnResult;
                }

                var rootUploadFolder = (await this._configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                if (string.IsNullOrEmpty(rootUploadFolder)) rootUploadFolder = isWindow ? @"D:\Uploads" : "/var/www/uploads";
                string communityMediaFolder = Path.Combine(rootUploadFolder, "community-media", createCommunityMedia.CommunityId);
                if (!Directory.Exists(communityMediaFolder)) Directory.CreateDirectory(communityMediaFolder);
                string fileGuidName = $"{Guid.NewGuid()}{Path.GetExtension(createCommunityMedia.File.FileName)}";
                fileDestination = Path.Combine(communityMediaFolder, fileGuidName);

                //Check for duplicate hash
                string sha256Hash = await HelperUtils.HashFileAsync(createCommunityMedia.File);
                var sameHashMedia = await _context.CommunityMedias.Where(x => x.SHA256Hash == sha256Hash
                                                                        && x.CommunityId == createCommunityMedia.CommunityId)
                                                                        .IgnoreQueryFilters()
                                                                        .FirstOrDefaultAsync();
                if (sameHashMedia != null)
                {
                    if (sameHashMedia.Deleted)
                    {
                        sameHashMedia.Deleted = false;
                        sameHashMedia.IsPrimary = true;
                        sameHashMedia.DateDeleted = null;
                    }
                    else if (sameHashMedia.IsPrimary)
                    {
                        returnResult.Result = _mapper.Map<SelectCommunityMediaDTO>(sameHashMedia);
                        await _cacheService.SetCacheAsync($"community-media-{sameHashMedia.Id}", sameHashMedia.StoreDestination, cacheEntryOptions);
                        await _communityService.UpdateCommunityCoverPhotoUrl(sameHashMedia.CommunityId, sameHashMedia.Id);
                        return returnResult;
                    }
                    else
                    {
                        sameHashMedia.IsPrimary = true;
                    }
                }
                else
                {
                    using (var stream = new FileStream(fileDestination, FileMode.Create))
                    {
                        await createCommunityMedia.File.CopyToAsync(stream);
                    }
                }

                CommunityMedia? primaryMedia = await _context.CommunityMedias.Where(x => x.CommunityId == createCommunityMedia.CommunityId
                                                                                        && x.IsPrimary)
                                                                                    .FirstOrDefaultAsync();

                if (primaryMedia != null) primaryMedia.IsPrimary = false;

                //Only add new if same hash media does not exist
                if (sameHashMedia == null)
                {
                    newCommunityMedia = new CommunityMedia
                    {
                        CommunityId = createCommunityMedia.CommunityId,
                        IsPrimary = true,
                        StoreDestination = fileDestination,
                        SHA256Hash = sha256Hash,
                    };
                    await _context.CommunityMedias.AddAsync(newCommunityMedia);
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectCommunityMediaDTO>(newCommunityMedia ?? sameHashMedia);
                    var media = newCommunityMedia ?? sameHashMedia;
                    if (!string.IsNullOrEmpty(media?.Id) && !string.IsNullOrEmpty(media?.CommunityId)) await _communityService.UpdateCommunityCoverPhotoUrl(media.CommunityId, media.Id);
                    if (!string.IsNullOrEmpty(primaryMedia?.Id)) await _cacheService.RemoveCacheAsync($"community-media-{primaryMedia.Id}");
                }
                else
                {
                    if (File.Exists(fileDestination)) File.Delete(fileDestination);
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                    return returnResult;
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

        public async Task<ReturnResult<SelectCommunityMediaDTO>> UpdatePrimary(UpdatePrimaryCommunityMediaDTO updatePrimaryCommunityMedia)
        {
            ReturnResult<SelectCommunityMediaDTO> returnResult = new();
            try
            {
                //Guard: verify community ownership
                var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == updatePrimaryCommunityMedia.CommunityId);
                if (community == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community", updatePrimaryCommunityMedia.CommunityId);
                    return returnResult;
                }
                if (community.OwnerId != _userContext.ProfileId)
                {
                    returnResult.Message = "You do not have permission to manage this community's media";
                    return returnResult;
                }

                CommunityMedia? primaryMedia = await _context.CommunityMedias.Where(x => x.CommunityId == updatePrimaryCommunityMedia.CommunityId
                                                                                        && x.IsPrimary)
                                                                                    .FirstOrDefaultAsync();

                if (primaryMedia != null)
                {
                    if (primaryMedia.Id == updatePrimaryCommunityMedia.Id)
                    {
                        returnResult.Message = "This image is already set as primary";
                        return returnResult;
                    }
                    else primaryMedia.IsPrimary = false;
                }

                CommunityMedia? updatedPrimaryMedia = await _context.CommunityMedias.Where(x => x.CommunityId == updatePrimaryCommunityMedia.CommunityId
                                                                                        && x.Id == updatePrimaryCommunityMedia.Id)
                                                                                        .FirstOrDefaultAsync();

                if (updatedPrimaryMedia != null) updatedPrimaryMedia.IsPrimary = true;
                else
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community media", updatePrimaryCommunityMedia.Id);
                    return returnResult;
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectCommunityMediaDTO>(updatedPrimaryMedia);
                    await _communityService.UpdateCommunityCoverPhotoUrl(updatedPrimaryMedia.CommunityId, updatedPrimaryMedia.Id);
                    await _cacheService.SetCacheAsync($"community-media-{updatedPrimaryMedia.Id}", updatedPrimaryMedia.StoreDestination, cacheEntryOptions);
                    if (primaryMedia != null) await _cacheService.RemoveCacheAsync($"community-media-{primaryMedia.Id}");
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                    return returnResult;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> Delete([TrimmedRequired] string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var deleteCommunityMedia = await _context.CommunityMedias.FirstOrDefaultAsync(x => x.Id == id);
                if (deleteCommunityMedia == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community media", id);
                    return returnResult;
                }

                //Guard: verify community ownership
                var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == deleteCommunityMedia.CommunityId);
                if (community == null || community.OwnerId != _userContext.ProfileId)
                {
                    returnResult.Message = "You do not have permission to manage this community's media";
                    return returnResult;
                }

                _context.Remove(deleteCommunityMedia);
                if (await this._context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;
                    await _cacheService.RemoveCacheAsync($"community-media-{deleteCommunityMedia.Id}");
                    if (deleteCommunityMedia.IsPrimary) await _communityService.UpdateCommunityCoverPhotoUrl(deleteCommunityMedia.CommunityId, "");
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                    return returnResult;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkDelete(List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var deleteCommunityMedias = await _context.CommunityMedias.Where(x => ids.Contains(x.Id)).ToListAsync();
                if (deleteCommunityMedias.Count == 0)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ALL_ITEM_NOT_FOUND);
                    return returnResult;
                }

                //Guard: verify all belong to communities owned by current user
                var communityIds = deleteCommunityMedias.Select(x => x.CommunityId).Distinct().ToList();
                var ownedCommunityIds = await _context.Communities
                    .Where(c => communityIds.Contains(c.Id) && c.OwnerId == _userContext.ProfileId)
                    .Select(c => c.Id)
                    .ToListAsync();

                if (ownedCommunityIds.Count != communityIds.Count)
                {
                    returnResult.Message = "You do not have permission to manage some of these community media items";
                    return returnResult;
                }

                _context.RemoveRange(deleteCommunityMedias);
                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = deleteCommunityMedias.Count;
                    var primaryMedia = deleteCommunityMedias.Where(x => x.IsPrimary).FirstOrDefault();
                    if (primaryMedia != null) await _communityService.UpdateCommunityCoverPhotoUrl(primaryMedia.CommunityId, "");
                    await Task.WhenAll(deleteCommunityMedias.Select(x => _cacheService.RemoveCacheAsync($"community-media-{x.Id}")));
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                    return returnResult;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
