using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Attributes;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QAPostsController : ControllerBase
    {
        private readonly IQAPostService _qaPostService;

        public QAPostsController(IQAPostService qaPostService)
        {
            _qaPostService = qaPostService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateQAPostDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.CreateAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("share")]
        public async Task<IActionResult> CreateShare([FromBody] CreateQAPostShareDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.CreateShareAsync(createDTO);
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
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            if (returnResult.Result == null)
            {
                return NotFound(returnResult);
            }
            return Ok(returnResult);
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetPage([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                returnResult = await _qaPostService.GetPageAsync(page);
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
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO,string>>();
            try
            {
                returnResult = await _qaPostService.GetPageAsyncByProfileId(page, profileId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("community/{communityId}/paging")]
        public async Task<IActionResult> GetPagingByCommunityId([FromBody] Page<string> page, [TrimmedRequired] string communityId)
        {
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                returnResult = await _qaPostService.GetPageAsyncByCommunityId(page, communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("community/{communityId}/pending/paging")]
        public async Task<IActionResult> GetPendingPostsByCommunityId([FromBody] Page<string> page, [TrimmedRequired] string communityId)
        {
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                returnResult = await _qaPostService.GetPendingPostsByCommunityIdAsync(page, communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("community/{communityId}/my-pending/paging")]
        public async Task<IActionResult> GetMyPendingPostsByCommunityId([FromBody] Page<string> page, [TrimmedRequired] string communityId)
        {
            var returnResult = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                returnResult = await _qaPostService.GetMyPendingPostsByCommunityIdAsync(page, communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("{id}/community-approve")]
        public async Task<IActionResult> ApproveCommunityPost(string id)
        {
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.ApproveCommunityPostAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("{id}/community-reject")]
        public async Task<IActionResult> RejectCommunityPost(string id, [FromBody] platform_core_service.Common.Models.DTOs.EntityDTO.Post.RejectCommunityPostDTO request)
        {
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.RejectCommunityPostAsync(id, request?.Reason);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateQAPostDTO updateDTO)
        {
            var returnResult = new ReturnResult<SelectQAPostDTO>();
            try
            {
                returnResult = await _qaPostService.UpdateAsync(updateDTO);
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
                returnResult = await _qaPostService.DeleteByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteMany([FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                returnResult = await _qaPostService.DeleteManyAsync(page.Selected);
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
