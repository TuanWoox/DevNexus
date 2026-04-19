using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IQAMediaService
    {
        Task<string> GetQAMedia([TrimmedRequired] string Id);
        Task<ReturnResult<SelectQAMediaDTO>> UploadImage(IFormFile file);
        Task<ReturnResult<InitUploadQAVideoDTO>> InitVideoUpload(CreateVideoUploadDTO createVideoUploadDTO);
        Task<ReturnResult<VideoChunkProgressDTO>> UploadVideoChunk(UploadVideoChunkDTO dto);
        Task<ReturnResult<SelectQAMediaDTO>> MergeVideoChunks(MergeVideoChunkDTO dto);
    }
}
