using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserContentInteraction;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserRecommendationFeedback;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecommendationsController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;
        private readonly ITrendingService _trendingService;
        private readonly IInteractionService _interactionService;

        public RecommendationsController(
            IRecommendationService recommendationService,
            ITrendingService trendingService,
            IInteractionService interactionService)
        {
            _recommendationService = recommendationService;
            _trendingService = trendingService;
            _interactionService = interactionService;
        }

        [HttpPost("posts/feed/paging")]
        public async Task<IActionResult> GetPersonalizedPostFeed([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                returnResult = await _recommendationService.GetPersonalizedPostFeedAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("qaposts/feed/paging")]
        public async Task<IActionResult> GetPersonalizedQAPostFeed([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                returnResult = await _recommendationService.GetPersonalizedQAPostFeedAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("communities/feed/paging")]
        public async Task<IActionResult> GetPersonalizedCommunityFeed([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommunityDTO, string>>();
            try
            {
                returnResult = await _recommendationService.GetPersonalizedCommunityFeedAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpGet("trending/posts")]
        public async Task<IActionResult> GetTrendingPosts([FromQuery] string period = "7d", [FromQuery] int limit = 5)
        {
            var returnResult = new ReturnResult<List<SelectPostDTO>>();
            try
            {
                returnResult = await _trendingService.GetTrendingPostsAsync(period, limit);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpGet("trending/communities")]
        public async Task<IActionResult> GetTrendingCommunities([FromQuery] string period = "7d", [FromQuery] int limit = 5)
        {
            var returnResult = new ReturnResult<List<SelectCommunityDTO>>();
            try
            {
                returnResult = await _trendingService.GetTrendingCommunitiesAsync(period, limit);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("interactions/track")]
        public async Task<IActionResult> TrackInteraction([FromBody] SelectUserContentInteractionDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _interactionService.TrackAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }

        [HttpPost("feedback")]
        public async Task<IActionResult> SubmitFeedback([FromBody] CreateUserRecommendationFeedbackDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _interactionService.SubmitFeedbackAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }

            return Ok(returnResult);
        }
    }
}
