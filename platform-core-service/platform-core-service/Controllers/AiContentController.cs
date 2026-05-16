using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiContentController : ControllerBase
    {
        private readonly IAiContentService _aiContentService;

        public AiContentController(IAiContentService aiContentService)
        {
            _aiContentService = aiContentService;
        }

        [HttpPost("metadata")]
        public async Task<IActionResult> SuggestMetadata([FromBody] AIMetadataRequestDTO request)
        {
            var result = await _aiContentService.SuggestMetadataAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Lazily generates a TL;DR bullet-point summary for a post.
        /// Only fires when the user explicitly requests it - no auto-generation on load.
        /// </summary>
        [HttpPost("posts/{postId}/summary")]
        public async Task<IActionResult> SummarizePost(
            [FromRoute] string postId,
            [FromBody] SummarizePostRequestDTO request)
        {
            var result = await _aiContentService.SummarizePostAsync(postId, request);
            return Ok(result);
        }
    }
}
