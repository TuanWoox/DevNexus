using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAnswerMediaService
    {
        Task<string> GetMedia(string id);
        Task<ReturnResult<SelectAnswerMediaDTO>> UploadImage(IFormFile file);
        Task<ReturnResult<ContentInitUploadVideoDTO<SelectAnswerMediaDTO>>> InitVideoUpload(CreateVideoUploadDTO dto);
        Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto);
        Task<ReturnResult<SelectAnswerMediaDTO>> MergeVideoChunks(MergeVideoChunkDTO dto);
    }
}
