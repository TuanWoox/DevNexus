using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiContentController : ControllerBase
    {
        private const int MinSummaryContentLength = 300;

        private readonly IAiWorkerClient _aiWorkerClient;
        private readonly IPostService _postService;

        public AiContentController(IAiWorkerClient aiWorkerClient, IPostService postService)
        {
            _aiWorkerClient = aiWorkerClient;
            _postService = postService;
        }

        [HttpPost("metadata")]
        public async Task<IActionResult> SuggestMetadata([FromBody] AIMetadataRequestDTO request)
        {
            ReturnResult<AIMetadataResponseDTO> returnResult = new();
            try
            {
                returnResult = await _aiWorkerClient.SuggestMetadataAsync(request);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        /// <summary>
        /// Lazily generates a TL;DR bullet-point summary for a post.
        /// Only fires when the user explicitly requests it — no auto-generation on load.
        /// </summary>
        [HttpPost("posts/{postId}/summary")]
        public async Task<IActionResult> SummarizePost(
            [FromRoute] string postId,
            [FromBody] SummarizePostRequestDTO request)
        {
            var returnResult = new ReturnResult<SummarizePostResponseDTO>();
            try
            {
                var postResult = await _postService.GetByIdAsync(postId);
                if (postResult?.Result == null)
                {
                    returnResult.Message = "Post not found.";
                    return Ok(returnResult);
                }

                var content = postResult.Result.Content ?? string.Empty;
                if (content.Length < MinSummaryContentLength)
                {
                    returnResult.Message = "Post content is too short to summarize.";
                    return Ok(returnResult);
                }

                var aiRequest = new AISummarizeRequestDTO
                {
                    Content = content,
                    Language = request?.Language ?? "vi",
                };

                var aiResult = await _aiWorkerClient.SummarizeContentAsync(aiRequest);
                if (aiResult?.Result == null)
                {
                    returnResult.Message = aiResult?.Message ?? "AI worker could not generate a summary.";
                    return Ok(returnResult);
                }

                returnResult.Result = new SummarizePostResponseDTO
                {
                    PostId = postId,
                    SummaryPoints = aiResult.Result.SummaryPoints,
                    OriginalEstimatedReadTimeSeconds = aiResult.Result.EstimatedReadTimeSeconds,
                    SummaryEstimatedReadTimeSeconds = 60,
                    Cached = false,
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiContentController] SummarizePost failed: {ex.Message}");
                returnResult.Message = $"An error occurred while generating the summary.";
            }

            return Ok(returnResult);
        }
    }
}

