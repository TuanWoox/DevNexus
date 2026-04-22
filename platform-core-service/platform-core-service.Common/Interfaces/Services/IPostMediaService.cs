using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IPostMediaService
    {
        Task<string> GetPostMedia([TrimmedRequired] string Id);
        Task<ReturnResult<SelectPostMediaDTO>> UploadImage(IFormFile file);
        Task<ReturnResult<InitUploadVideoDTO>> InitVideoUpload(CreateVideoUploadDTO createVideoUploadDTO);
        Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto);
        Task<ReturnResult<SelectPostMediaDTO>> MergeVideoChunks(MergeVideoChunkDTO dto);
    }
}
