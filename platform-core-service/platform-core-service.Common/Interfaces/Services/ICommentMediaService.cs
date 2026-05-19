using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommentMediaService
    {
        Task<string> GetMedia(string id);
        Task<ReturnResult<SelectCommentMediaDTO>> UploadImage(IFormFile file);
        Task<ReturnResult<ContentInitUploadVideoDTO<SelectCommentMediaDTO>>> InitVideoUpload(CreateVideoUploadDTO dto);
        Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto);
        Task<ReturnResult<SelectCommentMediaDTO>> MergeVideoChunks(MergeVideoChunkDTO dto);
    }
}
