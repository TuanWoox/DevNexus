using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IPostMediaService _postMediaService;
        private readonly IQAMediaService _qaMediaService;
        private readonly IAnswerMediaService _answerMediaService;
        private readonly ICommentMediaService _commentMediaService;

        public ContentMediaController(
            IPostMediaService postMediaService,
            IQAMediaService qaMediaService,
            IAnswerMediaService answerMediaService,
            ICommentMediaService commentMediaService)
        {
            _postMediaService = postMediaService;
            _qaMediaService = qaMediaService;
            _answerMediaService = answerMediaService;
            _commentMediaService = commentMediaService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMedia(string id, [FromQuery] ContentType contentType)
        {
            var fileDestination = contentType switch
            {
                ContentType.Post => await _postMediaService.GetPostMedia(id),
                ContentType.QA => await _qaMediaService.GetQAMedia(id),
                ContentType.Answer => await _answerMediaService.GetMedia(id),
                ContentType.Comment => await _commentMediaService.GetMedia(id),
                _ => ""
            };

            if (string.IsNullOrEmpty(fileDestination) || !System.IO.File.Exists(fileDestination)) return NotFound();
            return PhysicalFile(fileDestination, GetMimeType(fileDestination));
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] ContentType contentType)
        {
            if (file == null || file.Length == 0) return Ok(new ReturnResult<object> { Message = "File cannot be null or empty" });

            object result = contentType switch
            {
                ContentType.Post => await _postMediaService.UploadImage(file),
                ContentType.QA => await _qaMediaService.UploadImage(file),
                ContentType.Answer => await _answerMediaService.UploadImage(file),
                ContentType.Comment => await _commentMediaService.UploadImage(file),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        [HttpPost("init-video-upload")]
        public async Task<IActionResult> InitVideoUpload([FromBody] CreateVideoUploadDTO dto, [FromQuery] ContentType contentType)
        {
            object result = contentType switch
            {
                ContentType.Post => await _postMediaService.InitVideoUpload(dto),
                ContentType.QA => await _qaMediaService.InitVideoUpload(dto),
                ContentType.Answer => await _answerMediaService.InitVideoUpload(dto),
                ContentType.Comment => await _commentMediaService.InitVideoUpload(dto),
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
                ContentType.Post => await _postMediaService.UploadVideoChunk(dto),
                ContentType.QA => await _qaMediaService.UploadVideoChunk(dto),
                ContentType.Answer => await _answerMediaService.UploadVideoChunk(dto),
                ContentType.Comment => await _commentMediaService.UploadVideoChunk(dto),
                _ => new ReturnResult<object> { Message = "Invalid content type" }
            };

            return Ok(result);
        }

        [HttpPost("merge-video-chunks")]
        public async Task<IActionResult> MergeVideoChunks([FromBody] MergeVideoChunkDTO dto, [FromQuery] ContentType contentType)
        {
            object result = contentType switch
            {
                ContentType.Post => await _postMediaService.MergeVideoChunks(dto),
                ContentType.QA => await _qaMediaService.MergeVideoChunks(dto),
                ContentType.Answer => await _answerMediaService.MergeVideoChunks(dto),
                ContentType.Comment => await _commentMediaService.MergeVideoChunks(dto),
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
                _ => "application/octet-stream"
            };
        }
    }
}
