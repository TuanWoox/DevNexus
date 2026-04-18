using AutoMapper;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace platform_core_service.Business.Services
{
    public class ProfileMediaService(
        ApplicationDbContext context,
        IMapper mapper,
        IRepository<ProfileMedia, string> repostiory,
        IConfigurationService configurationService,
        IUserContext userContext,
        ICloudinary cloudinary
    ) : IProfileMediaService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<ProfileMedia, string> _repository = repostiory;
        private readonly IConfigurationService _configurationService = configurationService;
        private readonly bool isWindow = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? true : false;
        private readonly IUserContext _userContext = userContext;
        private readonly ICloudinary _cloudinary = cloudinary;
        public async Task<string> GetById([TrimmedRequired] string Id)
        {
            string fileDestination = "";
            try
            {
                ProfileMedia? profileMedia = await _context.ProfileMedias.FirstOrDefaultAsync(x => x.Id == Id);
                if(profileMedia != null)
                {
                    fileDestination = profileMedia.StoreDestination;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return fileDestination;
        }
        public async Task<ReturnResult<PagedData<SelectProfileMediaDTO, string>>> GetPaging([TrimmedRequired] string ProfileId, Page<string> page)
        {
            ReturnResult<PagedData<SelectProfileMediaDTO, string>> returnResult = new();
            try
            {
                var query = _context.ProfileMedias.Where(x => x.ProfileId == ProfileId).OrderByDescending(x => x.IsPrimary).AsQueryable().AsNoTracking();
                var pagingResult = await _repository.GetPagingAsync<Page<string>, SelectProfileMediaDTO>(query, page);
                returnResult.Result = pagingResult;
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
        public async Task<ReturnResult<SelectProfileMediaDTO>> Create(CreateProfileMediaDTO createProfileMedia)
        {
            ReturnResult<SelectProfileMediaDTO> returnResult = new ReturnResult<SelectProfileMediaDTO>();
            string fileDestination = "";
            ProfileMedia? newProfileMedia = null;
            try
            {
                //Guard to check image extension
                if (!createProfileMedia.File.HasValidImageExtension())
                {
                    returnResult.Message = "Image extension not allow";
                    return returnResult;
                }
                var rootUploadFolder = (await this._configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                //If you read this code later => just know that i assign this one more time be sure
                if (string.IsNullOrEmpty(rootUploadFolder)) rootUploadFolder = isWindow ? @"D:\Uploads" : "/var/www/uploads";
                string profileMediaFolder = Path.Combine(rootUploadFolder, "profile-media", _userContext.UserId);
                if (!Directory.Exists(profileMediaFolder)) Directory.CreateDirectory(profileMediaFolder);
                string fileGuidName = $"{Guid.NewGuid()}{Path.GetExtension(createProfileMedia.File.FileName)}";
                fileDestination = Path.Combine(profileMediaFolder, fileGuidName);
                //Check see if we have the same hash file
                string sha256HashProfileMedia = await this.HashFileAsync(createProfileMedia.File);
                //Find the samehashProfileMedia althought it is delete or exist => just have the same shahash => then we take
                var sameHashProfileMedia = await _context.ProfileMedias.Where(x => x.SHA256Hash == sha256HashProfileMedia
                                                                        && x.ProfileId == _userContext.ProfileId
                                                                        && x.ProfileMediaType == createProfileMedia.ProfileMediaType)
                                                                        .IgnoreQueryFilters()
                                                                        .FirstOrDefaultAsync();
                if (sameHashProfileMedia != null)
                {
                    if (sameHashProfileMedia.Deleted)
                    {
                        sameHashProfileMedia.Deleted = false;
                        sameHashProfileMedia.DateDeleted = null;
                    } else if (sameHashProfileMedia.IsPrimary)
                    {
                        returnResult.Result = _mapper.Map<SelectProfileMediaDTO>(sameHashProfileMedia);
                        return returnResult;
                    }
                    else sameHashProfileMedia.IsPrimary = true;
                }
                else
                {
                    //Automatically dispose => So we dont have memory leak
                    using (var stream = new FileStream(fileDestination, FileMode.Create))
                    {
                        await createProfileMedia.File.CopyToAsync(stream);

                    }
                }

                ProfileMedia? primaryProfileMedia = await _context.ProfileMedias.Where(x => x.ProfileId == _userContext.ProfileId
                                                                                        && x.IsPrimary
                                                                                        && x.ProfileMediaType == createProfileMedia.ProfileMediaType)
                                                                                    .FirstOrDefaultAsync();
                // The profile media is different than the inserted new one and the newhashprofile
                if (primaryProfileMedia != null) primaryProfileMedia.IsPrimary = false;
  
                //Only add new if same hash media does not exist
                if (sameHashProfileMedia == null)
                {
                    newProfileMedia = new ProfileMedia
                    {
                        ProfileId = _userContext.ProfileId,
                        IsPrimary = true,
                        StoreDestination = fileDestination,
                        ProfileMediaType = createProfileMedia.ProfileMediaType,
                        SHA256Hash = sha256HashProfileMedia,
                    };
                    await _context.ProfileMedias.AddAsync(newProfileMedia);
                }

                //Save change everything
                if (await _context.SaveChangesAsync() > 0) returnResult.Result = _mapper.Map<SelectProfileMediaDTO>(newProfileMedia ?? sameHashProfileMedia);
                else
                {
                    //If datbase fail => then we delete the file we newly created
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
        public async Task<ReturnResult<SelectProfileMediaDTO>> UpdatePrimary(UpdatePrimaryProfileMediaDTO updatePrimaryProfileMedia)
        {
            ReturnResult<SelectProfileMediaDTO> returnResult = new();
            try
            {
                ProfileMedia? primaryProfileMedia = await _context.ProfileMedias.Where(x => x.ProfileId == _userContext.ProfileId
                                                                                        && x.IsPrimary
                                                                                        && x.ProfileMediaType == updatePrimaryProfileMedia.ProfileMediaType)
                                                                                    .FirstOrDefaultAsync();

                if(primaryProfileMedia != null)
                {
                    if (primaryProfileMedia.Id == updatePrimaryProfileMedia.Id)
                    {
                        returnResult.Message = "This image is already set as primary";
                        return returnResult;
                    }
                    else primaryProfileMedia.IsPrimary = false;
                }

                ProfileMedia? updatedPrimaryProfileMedia = await _context.ProfileMedias.Where(x => x.ProfileId == _userContext.ProfileId
                                                                                        && x.Id == updatePrimaryProfileMedia.Id
                                                                                        && x.ProfileMediaType == updatePrimaryProfileMedia.ProfileMediaType)
                                                                                        .FirstOrDefaultAsync();

                if (updatedPrimaryProfileMedia != null) updatedPrimaryProfileMedia.IsPrimary = true;
                else
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "profile media", updatePrimaryProfileMedia.Id);
                    return returnResult;
                }

                if(await _context.SaveChangesAsync() > 0 ) returnResult.Result = _mapper.Map<SelectProfileMediaDTO>(updatedPrimaryProfileMedia);
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                    return returnResult;
                }
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
        public async  Task<ReturnResult<bool>> Delete([TrimmedRequired] string id)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                var deleteProfileMedia = await _context.ProfileMedias.FirstOrDefaultAsync(x => x.Id == id
                                                                                        &&  x.ProfileId == _userContext.ProfileId);
                if (deleteProfileMedia != null)
                {
                    _context.Remove(deleteProfileMedia);
                    if (await this._context.SaveChangesAsync() > 0) returnResult.Result = true;
                    else
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                        return returnResult;
                    }
                }
                else
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "profile media", id);
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
                var deleteProfileMedias = await _context.ProfileMedias.Where(x => x.ProfileId == _userContext.ProfileId && ids.Contains(x.Id)).ToListAsync();
                if(deleteProfileMedias.Count > 0)
                {
                    _context.RemoveRange(deleteProfileMedias);
                    if (await _context.SaveChangesAsync() > 0) returnResult.Result = deleteProfileMedias.Count;
                    else
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                        return returnResult;
                    }
                } 
                else
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ALL_ITEM_NOT_FOUND);
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
        private async Task<string> HashFileAsync(IFormFile file)
        {
            using var sha256 = SHA256.Create();
            using var stream = file.OpenReadStream();

            var hashBytes = await sha256.ComputeHashAsync(stream);
            return Convert.ToHexString(hashBytes); 
        }
        private async Task<string> UploadToCloundinary(IFormFile File, string fileGuidName)
        {
            string fileCDNUrl = "";
            try
            {
                var uploadResult = await _cloudinary.UploadAsync(new ImageUploadParams
                {
                    File = new FileDescription(fileGuidName, File.OpenReadStream()),
                    Folder = $"profile-media",
                    PublicId = Path.GetFileNameWithoutExtension(fileGuidName),
                });
                // We dont care if it fails or not => If upload to CDN fail => fall back to use on our local file
                if (uploadResult.Error != null)
                {
                    DevNexusLogger.Instance.Error(uploadResult.Error.Message);
                }
                else fileCDNUrl = uploadResult.SecureUrl.ToString();
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
            }
            return fileCDNUrl;
        }
    }
}
