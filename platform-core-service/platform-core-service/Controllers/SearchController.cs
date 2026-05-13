using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Search;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpPost("all")]
        public async Task<IActionResult> SearchAll([FromBody] Page<string> page, CancellationToken cancellationToken)
        {
            var returnResult = new ReturnResult<GlobalSearchResultDTO>();
            try
            {
                returnResult = await _searchService.SearchAllAsync(page, cancellationToken);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("posts")]
        public async Task<IActionResult> SearchPosts([FromBody] Page<string> page, CancellationToken cancellationToken)
        {
            var returnResult = new ReturnResult<PagedData<SearchPostResultDTO, string>>();
            try
            {
                returnResult.Result = await _searchService.SearchPostsAsync(page, cancellationToken);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("questions")]
        public async Task<IActionResult> SearchQAPosts([FromBody] Page<string> page, CancellationToken cancellationToken)
        {
            var returnResult = new ReturnResult<PagedData<SearchQAPostResultDTO, string>>();
            try
            {
                returnResult.Result = await _searchService.SearchQAPostsAsync(page, cancellationToken);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("communities")]
        public async Task<IActionResult> SearchCommunities([FromBody] Page<string> page, CancellationToken cancellationToken)
        {
            var returnResult = new ReturnResult<PagedData<SearchCommunityResultDTO, string>>();
            try
            {
                returnResult.Result = await _searchService.SearchCommunitiesAsync(page, cancellationToken);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("profiles")]
        public async Task<IActionResult> SearchProfiles([FromBody] Page<string> page, CancellationToken cancellationToken)
        {
            var returnResult = new ReturnResult<PagedData<SearchProfileResultDTO, string>>();
            try
            {
                returnResult.Result = await _searchService.SearchProfilesAsync(page, cancellationToken);
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
