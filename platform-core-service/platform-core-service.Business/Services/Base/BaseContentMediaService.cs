using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services.Base
{
    public abstract class BaseContentMediaService<TEntity, TSelectDto>
        where TEntity : class, IContentMedia, new()
        where TSelectDto : class
    {
        protected readonly ApplicationDbContext _context;
        protected readonly ICacheService _cacheService;
        protected readonly ISocialGuardService _socialGuard;
        protected readonly IConfigurationService _configurationService;
        protected readonly IUserContext _userContext;
        protected readonly IMapper _mapper;

        protected BaseContentMediaService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ISocialGuardService socialGuard,
            IConfigurationService configurationService,
            IUserContext userContext,
            IMapper mapper)
        {
            _context = context;
            _cacheService = cacheService;
            _socialGuard = socialGuard;
            _configurationService = configurationService;
            _userContext = userContext;
            _mapper = mapper;
        }

        protected abstract DbSet<TEntity> DbSet { get; }
        protected abstract string MediaFolderName { get; }
        protected abstract string CacheKeyPrefix { get; }
        protected abstract IQueryable<TEntity> IncludeNavigation(IQueryable<TEntity> query);
        protected abstract PostMediaType GetMediaType(TEntity entity);
        protected abstract TEntity CreateEntity(string storeDestination, string sha256Hash, PostMediaType mediaType);

        protected virtual IQueryable<TEntity> GetDuplicateQuery(string sha256Hash, PostMediaType mediaType)
            => DbSet.IgnoreQueryFilters()
                .Where(x => x.SHA256Hash == sha256Hash)
                .Where(x => GetMediaType(x) == mediaType);

        public virtual async Task<string> GetMedia(string id)
        {
            try
            {
                var media = await IncludeNavigation(DbSet.Where(x => x.Id == id)).FirstOrDefaultAsync();
                if (media == null) return "";

                var authorId = media.GetAuthorId();
                if (string.IsNullOrEmpty(authorId)) return "";

                var canAccess = (await _socialGuard.CheckVisibleContent(authorId, media.GetCommunityId())).Result;
                if (!canAccess) return "";

                var cacheDestination = await _cacheService.GetCacheAsync<string>($"{CacheKeyPrefix}{media.Id}");
                if (!string.IsNullOrEmpty(cacheDestination)) return cacheDestination;

                if (!string.IsNullOrEmpty(media.StoreDestination))
                {
                    await _cacheService.SetCacheAsync($"{CacheKeyPrefix}{media.Id}", media.StoreDestination, HelperUtils.CacheEntryOptions);
                    return media.StoreDestination;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

            return "";
        }

        public virtual async Task<ReturnResult<TSelectDto>> UploadImage(IFormFile file)
        {
            var returnResult = new ReturnResult<TSelectDto>();
            string fileDestination = "";

            try
            {
                if (!file.HasValidImageExtension())
                {
                    returnResult.Message = "Image extension not allow";
                    return returnResult;
                }

                fileDestination = await BuildFinalDestination(file.FileName);
                var hash = await HelperUtils.HashFileAsync(file);
                var sameHashMedia = await GetDuplicateQuery(hash, PostMediaType.Image).FirstOrDefaultAsync();

                if (sameHashMedia != null)
                {
                    if (sameHashMedia.Deleted)
                    {
                        await SaveFile(file, fileDestination);
                        sameHashMedia.StoreDestination = fileDestination;
                        sameHashMedia.Deleted = false;
                        sameHashMedia.DateDeleted = null;
                    }
                    else
                    {
                        returnResult.Result = _mapper.Map<TSelectDto>(sameHashMedia);
                        return returnResult;
                    }
                }
                else
                {
                    await SaveFile(file, fileDestination);
                    sameHashMedia = CreateEntity(fileDestination, hash, PostMediaType.Image);
                    await DbSet.AddAsync(sameHashMedia);
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<TSelectDto>(sameHashMedia);
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

        public virtual async Task<ReturnResult<ContentInitUploadVideoDTO<TSelectDto>>> InitVideoUpload(CreateVideoUploadDTO dto)
        {
            var returnResult = new ReturnResult<ContentInitUploadVideoDTO<TSelectDto>>();
            try
            {
                if (!dto.FileName.HasValidVideoExtension())
                {
                    returnResult.Message = "Video extension not allowed";
                    return returnResult;
                }

                var existing = await GetDuplicateQuery(dto.HashFile, PostMediaType.Video).FirstOrDefaultAsync();
                if (existing != null)
                {
                    if (existing.Deleted)
                    {
                        existing.Deleted = false;
                        existing.DateDeleted = null;
                        await _context.SaveChangesAsync();
                    }

                    returnResult.Result = new ContentInitUploadVideoDTO<TSelectDto>
                    {
                        IsDuplicate = true,
                        ExistingMedia = _mapper.Map<TSelectDto>(existing)
                    };
                    return returnResult;
                }

                string sessionId = Guid.NewGuid().ToString();
                string tempFolder = Path.Combine(await GetRootUploadFolder(), MediaFolderName, _userContext.UserId, "temp", sessionId);
                Directory.CreateDirectory(tempFolder);

                returnResult.Result = new ContentInitUploadVideoDTO<TSelectDto>
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

        public virtual async Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto)
        {
            var returnResult = new ReturnResult<VideoChunkProgressDTO>();
            try
            {
                string tempFolder = Path.Combine(await GetRootUploadFolder(), MediaFolderName, _userContext.UserId, "temp", dto.SessionId);
                if (!Directory.Exists(tempFolder))
                {
                    returnResult.Message = "Invalid session";
                    return returnResult;
                }

                string chunkPath = Path.Combine(tempFolder, $"chunk_{dto.ChunkIndex}");
                await SaveFile(dto.Chunk, chunkPath);

                int receivedChunks = Directory.GetFiles(tempFolder, "chunk_*").Length;
                returnResult.Result = new VideoChunkProgressDTO
                {
                    ReceivedChunks = receivedChunks,
                    TotalChunks = dto.TotalChunks,
                    IsComplete = receivedChunks == dto.TotalChunks
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = ex.Message;
            }

            return returnResult;
        }

        public virtual async Task<ReturnResult<TSelectDto>> MergeVideoChunks(MergeVideoChunkDTO dto)
        {
            var returnResult = new ReturnResult<TSelectDto>();
            string finalDestination = "";

            try
            {
                var existing = await GetDuplicateQuery(dto.FileHash, PostMediaType.Video).FirstOrDefaultAsync();
                if (existing != null && !existing.Deleted)
                {
                    returnResult.Result = _mapper.Map<TSelectDto>(existing);
                    return returnResult;
                }

                string rootUploadFolder = await GetRootUploadFolder();
                string tempFolder = Path.Combine(rootUploadFolder, MediaFolderName, _userContext.UserId, "temp", dto.SessionId);
                if (!Directory.Exists(tempFolder))
                {
                    returnResult.Message = "Invalid session";
                    return returnResult;
                }

                finalDestination = await BuildFinalDestination(dto.FileName);
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

                var media = existing ?? CreateEntity(finalDestination, dto.FileHash, PostMediaType.Video);
                if (existing == null)
                {
                    await DbSet.AddAsync(media);
                }
                else
                {
                    existing.StoreDestination = finalDestination;
                    existing.Deleted = false;
                    existing.DateDeleted = null;
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    Directory.Delete(tempFolder, true);
                    returnResult.Result = _mapper.Map<TSelectDto>(media);
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

        protected async Task<string> GetRootUploadFolder()
        {
            var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;
            return string.IsNullOrEmpty(rootUploadFolder) ? (HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads") : rootUploadFolder;
        }

        protected async Task<string> BuildFinalDestination(string fileName)
        {
            string mediaFolder = Path.Combine(await GetRootUploadFolder(), MediaFolderName, _userContext.UserId);
            Directory.CreateDirectory(mediaFolder);
            return Path.Combine(mediaFolder, $"{Guid.NewGuid()}{Path.GetExtension(fileName)}");
        }

        private static async Task SaveFile(IFormFile file, string destination)
        {
            using var stream = new FileStream(destination, FileMode.Create);
            await file.CopyToAsync(stream);
        }
    }
}
