using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Factories;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContentMediaController : ControllerBase
    {
        private readonly IContentMediaServiceFactory _mediaFactory;

        public ContentMediaController(IContentMediaServiceFactory mediaFactory)
        {
            _mediaFactory = mediaFactory;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMedia(string id, [FromQuery] ContentType contentType)
        {
            var fileDestination = contentType switch
            {
                ContentType.Post => await _mediaFactory.GetPostMediaService().GetPostMedia(id),
                ContentType.QA => await _mediaFactory.GetQAMediaService().GetQAMedia(id),
                ContentType.Answer => await _mediaFactory.GetAnswerMediaService().GetMedia(id),
                ContentType.Comment => await _mediaFactory.GetCommentMediaService().GetMedia(id),
                _ => ""
            };

            if (string.IsNullOrEmpty(fileDestination) || !System.IO.File.Exists(fileDestination)) return NotFound();
            var fileResult = PhysicalFile(fileDestination, GetMimeType(fileDestination));
            fileResult.EnableRangeProcessing = true;
            return fileResult;
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] ContentType contentType)
        {
            if (file == null || file.Length == 0) return Ok(new ReturnResult<object> { Message = "File cannot be null or empty" });

            object result = contentType switch
            {
                ContentType.Post => await _mediaFactory.GetPostMediaService().UploadImage(file),
                ContentType.QA => await _mediaFactory.GetQAMediaService().UploadImage(file),
                ContentType.Answer => await _mediaFactory.GetAnswerMediaService().UploadImage(file),
                ContentType.Comment => await _mediaFactory.GetCommentMediaService().UploadImage(file),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        [HttpPost("init-video-upload")]
        public async Task<IActionResult> InitVideoUpload([FromBody] CreateVideoUploadDTO dto, [FromQuery] ContentType contentType)
        {
            object result = contentType switch
            {
                ContentType.Post => await _mediaFactory.GetPostMediaService().InitVideoUpload(dto),
                ContentType.QA => await _mediaFactory.GetQAMediaService().InitVideoUpload(dto),
                ContentType.Answer => await _mediaFactory.GetAnswerMediaService().InitVideoUpload(dto),
                ContentType.Comment => await _mediaFactory.GetCommentMediaService().InitVideoUpload(dto),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        [HttpPost("upload-video-chunk")]
        public async Task<IActionResult> UploadVideoChunk([FromForm] UploadVideoChunkDTO dto, [FromQuery] ContentType contentType)
        {
            if (dto.Chunk == null || dto.Chunk.Length == 0) return Ok(new ReturnResult<VideoChunkProgressDTO> { Message = "Chunk cannot be null or empty" });

            object result = contentType switch
            {
                ContentType.Post => await _mediaFactory.GetPostMediaService().UploadVideoChunk(dto),
                ContentType.QA => await _mediaFactory.GetQAMediaService().UploadVideoChunk(dto),
                ContentType.Answer => await _mediaFactory.GetAnswerMediaService().UploadVideoChunk(dto),
                ContentType.Comment => await _mediaFactory.GetCommentMediaService().UploadVideoChunk(dto),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        [HttpPost("merge-video-chunks")]
        public async Task<IActionResult> MergeVideoChunks([FromBody] MergeVideoChunkDTO dto, [FromQuery] ContentType contentType)
        {
            object result = contentType switch
            {
                ContentType.Post => await _mediaFactory.GetPostMediaService().MergeVideoChunks(dto),
                ContentType.QA => await _mediaFactory.GetQAMediaService().MergeVideoChunks(dto),
                ContentType.Answer => await _mediaFactory.GetAnswerMediaService().MergeVideoChunks(dto),
                ContentType.Comment => await _mediaFactory.GetCommentMediaService().MergeVideoChunks(dto),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        private static string GetMimeType(string fileDestination)
        {
            return Path.GetExtension(fileDestination).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                ".avi" => "video/x-msvideo",
                ".mkv" => "video/x-matroska",
                ".flv" => "video/x-flv",
                ".wmv" => "video/x-ms-wmv",
                _ => "application/octet-stream"
            };
        }
    }
}
