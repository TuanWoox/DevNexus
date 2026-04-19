using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;


namespace platform_core_service.Business.Services
{
    public class PostMediaService
    (
        ApplicationDbContext context,
        ICacheService cacheService,
        ISocialGuardService socialGuardService,
        IConfigurationService configurationService,
        IUserContext userContext,
        IMapper mapper
    ): IPostMediaService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly ICacheService _cacheService = cacheService;
        private readonly ISocialGuardService _socialGuard = socialGuardService;
        private readonly IConfigurationService _configurationService = configurationService;
        private readonly IUserContext _userContext = userContext;
        private readonly IMapper _mapper = mapper;

        public async Task<string> GetPostMedia([TrimmedRequired] string Id)
        {
            string fileDestination = "";
            try
            {
                var postMedia = await _context.PostMedias.Where(x => x.Id == Id)
                                                        .Include(x => x.Post)
                                                        .FirstOrDefaultAsync();


                if(postMedia?.Post != null)
                {
                    string? communityId = postMedia.Post.CommunityId;
                    var canAccess = (await _socialGuard.CheckVisibleContent(postMedia.Post.AuthorId, communityId)).Result;
                    if(canAccess) 
                    {
                        var cacheDestination = await _cacheService.GetCacheAsync<string>($"post-media-{postMedia.Id}");
                        if (!string.IsNullOrEmpty(cacheDestination)) return cacheDestination;
                        else
                        {
                            if (!string.IsNullOrEmpty(postMedia.StoreDestination))
                            {
                                await _cacheService.SetCacheAsync($"post-media-{postMedia.Id}", postMedia.StoreDestination, HelperUtils.CacheEntryOptions);
                                fileDestination = postMedia.StoreDestination;
                            }                
                        }
                    }
                }
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return fileDestination;
        }
        public async Task<ReturnResult<SelectPostMediaDTO>> UploadImage(IFormFile file)
        {
            ReturnResult<SelectPostMediaDTO> returnResult = new();
            string fileDestination = "";
            var newPostMedia = new PostMedia();
            try
            {
                // Guard to check image extension
                if (!file.HasValidImageExtension())
                {
                    returnResult.Message = "Image extension not allow";
                    return returnResult;
                }

                var rootUploadFolder = (await this._configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                if (string.IsNullOrEmpty(rootUploadFolder)) rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";
                string profileMediaFolder = Path.Combine(rootUploadFolder, "post-media", _userContext.UserId);
                if (!Directory.Exists(profileMediaFolder)) Directory.CreateDirectory(profileMediaFolder);
                string fileGuidName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                fileDestination = Path.Combine(profileMediaFolder, fileGuidName);

                string sha256HashProfileMedia = await HelperUtils.HashFileAsync(file);

                var sameHashPostMedia = await _context.PostMedias.Where(x => x.SHA256Hash == sha256HashProfileMedia
                                                                         && x.Post.AuthorId == _userContext.UserId)
                                                                        .Include(x => x.Post)
                                                                        .IgnoreQueryFilters()
                                                                        .FirstOrDefaultAsync();
                if (sameHashPostMedia != null)
                {
                    if (sameHashPostMedia.Deleted)
                    {
                        // FIX #1: Restore the file to disk since it was deleted alongside the soft-delete
                        using (var stream = new FileStream(fileDestination, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        sameHashPostMedia.StoreDestination = fileDestination;
                        sameHashPostMedia.Deleted = false;
                        sameHashPostMedia.DateDeleted = null;
                    }
                    else
                    {
                        returnResult.Result = _mapper.Map<SelectPostMediaDTO>(sameHashPostMedia);
                        return returnResult;
                    }
                }
                else
                {
                    using (var stream = new FileStream(fileDestination, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }

                if (sameHashPostMedia == null)
                {
                    newPostMedia = new PostMedia
                    {
                        StoreDestination = fileDestination,
                        PostMediaType = PostMediaType.Image,
                        SHA256Hash = sha256HashProfileMedia,
                    };

                    await _context.PostMedias.AddAsync(newPostMedia);
                }

                // FIX #2: Prioritize sameHashPostMedia over newPostMedia when mapping
                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectPostMediaDTO>(sameHashPostMedia ?? newPostMedia);
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
        public async Task<ReturnResult<InitUploadVideoDTO>> InitVideoUpload(CreateVideoUploadDTO createVideoUploadDTO)
        {
            ReturnResult<InitUploadVideoDTO> returnResult = new();
            try
            {
                if (!createVideoUploadDTO.FileName.HasValidVideoExtension())
                {
                    returnResult.Message = "Video extension not allowed";
                    return returnResult;
                }

                //Duplicate check
                var existing = _context.PostMedias.Where(x => x.SHA256Hash == createVideoUploadDTO.HashFile
                                                    && x.Post != null
                                                    && x.Post.AuthorId == _userContext.UserId
                                                    && x.PostMediaType == PostMediaType.Video)
                                                .Include(x => x.Post)
                                                .AsNoTracking()
                                                .FirstOrDefaultAsync();

                if (existing != null)
                {
                    returnResult.Result = new InitUploadVideoDTO
                    {
                        IsDuplicate = true,
                        ExistingMedia = _mapper.Map<SelectPostMediaDTO>(existing)
                    };
                    return returnResult;
                }

                var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                if (string.IsNullOrEmpty(rootUploadFolder))
                    rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";

                string sessionId = Guid.NewGuid().ToString();
                string tempFolder = Path.Combine(rootUploadFolder, "post-media", _userContext.UserId, "temp", sessionId);
                if (!Directory.Exists(tempFolder)) Directory.CreateDirectory(tempFolder);

                returnResult.Result = new InitUploadVideoDTO
                {
                    SessionId = sessionId,
                    TempPath = tempFolder
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
        public async Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto)
        {
            ReturnResult<VideoChunkProgressDTO> returnResult = new();
            try
            {
                var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                if (string.IsNullOrEmpty(rootUploadFolder))
                    rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";

                string tempFolder = Path.Combine(rootUploadFolder, "post-media", _userContext.UserId, "temp", dto.SessionId);
                if (!Directory.Exists(tempFolder))
                {
                    returnResult.Message = "Invalid session";
                    return returnResult;
                }

                string chunkPath = Path.Combine(tempFolder, $"chunk_{dto.ChunkIndex}");
                using (var stream = new FileStream(chunkPath, FileMode.Create))
                {
                    await dto.Chunk.CopyToAsync(stream);
                }

                int receivedChunks = Directory.GetFiles(tempFolder, "chunk_*").Length;
                returnResult.Result = new VideoChunkProgressDTO
                {
                    ReceivedChunks = receivedChunks,
                    TotalChunks = dto.TotalChunks,
                    IsComplete = false
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
        public async Task<ReturnResult<SelectPostMediaDTO>> MergeVideoChunks(MergeVideoChunkDTO dto)
        {
            ReturnResult<SelectPostMediaDTO> returnResult = new();
            string finalDestination = "";
            try
            {
                var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
                if (string.IsNullOrEmpty(rootUploadFolder))
                    rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";

                string tempFolder = Path.Combine(rootUploadFolder, "post-media", _userContext.UserId, "temp", dto.SessionId);
                if (!Directory.Exists(tempFolder))
                {
                    returnResult.Message = "Invalid session";
                    return returnResult;
                }

                string videoFolder = Path.Combine(rootUploadFolder, "post-media", _userContext.UserId);
                if (!Directory.Exists(videoFolder)) Directory.CreateDirectory(videoFolder);

                string fileGuidName = $"{Guid.NewGuid()}{Path.GetExtension(dto.FileName)}";
                finalDestination = Path.Combine(videoFolder, fileGuidName);

                using (var finalStream = new FileStream(finalDestination, FileMode.Create))
                {
                    for (int i = 0; i < dto.TotalChunks; i++)
                    {
                        string chunkPath = Path.Combine(tempFolder, $"chunk_{i}");
                        if (!File.Exists(chunkPath))
                        {
                            if (File.Exists(finalDestination)) File.Delete(finalDestination);
                            returnResult.Message = $"Missing chunk {i}, upload failed";
                            return returnResult;
                        }
                        byte[] chunkBytes = await File.ReadAllBytesAsync(chunkPath);
                        await finalStream.WriteAsync(chunkBytes);
                    }
                }

                var newPostMedia = new PostMedia
                {
                    StoreDestination = finalDestination,
                    PostMediaType = PostMediaType.Video,
                    SHA256Hash = dto.FileHash
                };

                await _context.PostMedias.AddAsync(newPostMedia);

                if (await _context.SaveChangesAsync() > 0)
                {
                    Directory.Delete(tempFolder, true);
                    returnResult.Result = _mapper.Map<SelectPostMediaDTO>(newPostMedia);
                }
                else
                {
                    if (File.Exists(finalDestination)) File.Delete(finalDestination);
                    returnResult.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                }
            }
            catch (Exception ex)
            {
                if (File.Exists(finalDestination)) File.Delete(finalDestination);
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
