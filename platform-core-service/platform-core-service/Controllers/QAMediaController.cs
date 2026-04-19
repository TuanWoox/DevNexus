using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAMedia;
using platform_core_service.Common.Utils.Extensions; // Assume for some extensions if needed

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QAMediaController : ControllerBase
    {
        private readonly IQAMediaService _qaMediaService;

        public QAMediaController(IQAMediaService qaMediaService)
        {
            _qaMediaService = qaMediaService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetQAMedia(string id)
        {
            try
            {
                var fileDestination = await _qaMediaService.GetQAMedia(id);
                if (string.IsNullOrEmpty(fileDestination) || !System.IO.File.Exists(fileDestination))
                {
                    return NotFound();
                }

                var mimeType = "application/octet-stream"; // A more robust mime type mapper can be used
                var extension = Path.GetExtension(fileDestination).ToLowerInvariant();
                switch (extension)
                {
                    case ".jpg":
                    case ".jpeg": mimeType = "image/jpeg"; break;
                    case ".png": mimeType = "image/png"; break;
                    case ".gif": mimeType = "image/gif"; break;
                    case ".mp4": mimeType = "video/mp4"; break;
                }

                return PhysicalFile(fileDestination, mimeType);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                return StatusCode(500, "An error occurred while retrieving the media.");
            }
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            var returnResult = new ReturnResult<SelectQAMediaDTO>();
            try
            {
                if (file == null || file.Length == 0)
                {
                    returnResult.Message = "File cannot be null or empty";
                    return Ok(returnResult);
                }

                returnResult = await _qaMediaService.UploadImage(file);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("init-video-upload")]
        public async Task<IActionResult> InitVideoUpload([FromBody] CreateVideoUploadDTO dto)
        {
            var returnResult = new ReturnResult<InitUploadQAVideoDTO>();
            try
            {
                returnResult = await _qaMediaService.InitVideoUpload(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("upload-video-chunk")]
        public async Task<IActionResult> UploadVideoChunk([FromForm] UploadVideoChunkDTO dto)
        {
            var returnResult = new ReturnResult<VideoChunkProgressDTO>();
            try
            {
                if (dto.Chunk == null || dto.Chunk.Length == 0)
                {
                    returnResult.Message = "Chunk cannot be null or empty";
                    return Ok(returnResult);
                }

                returnResult = await _qaMediaService.UploadVideoChunk(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("merge-video-chunks")]
        public async Task<IActionResult> MergeVideoChunks([FromBody] MergeVideoChunkDTO dto)
        {
            var returnResult = new ReturnResult<SelectQAMediaDTO>();
            try
            {
                returnResult = await _qaMediaService.MergeVideoChunks(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}


