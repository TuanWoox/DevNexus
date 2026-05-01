using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePostDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                returnResult = await _postService.CreateAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                returnResult = await _postService.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpGet("community/{communityId}/post/{id}")]
        public async Task<IActionResult> GetByIdAndCommunityId([TrimmedRequired] string id, [TrimmedRequired] string communityId)
        {
            var returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                returnResult = await _postService.GetByIdAndCommunityId(id, communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetPage([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                returnResult = await _postService.GetPageAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
        [HttpPost("profile/{profileId}/paging")]
        public async Task<IActionResult> GetPagingByProfileId([FromBody] Page<string> page, [TrimmedRequired] string profileId)
        {
            var returnResult = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                returnResult = await _postService.GetPageAsyncByProfileId(page, profileId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdatePostDTO updateDTO)
        {
            var returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                returnResult = await _postService.UpdateAsync(updateDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteById(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _postService.DeleteByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteByIds([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                returnResult = await _postService.DeleteByIdsAsync(page.Selected);
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
