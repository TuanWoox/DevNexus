using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommunitiesController : ControllerBase
    {
        private readonly ICommunityService _communityService;

        public CommunitiesController(ICommunityService communityService)
        {
            _communityService = communityService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCommunityDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityDTO>();
            try
            {
                returnResult = await _communityService.CreateAsync(createDTO);
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
            var returnResult = new ReturnResult<SelectCommunityDTO>();
            try
            {
                returnResult = await _communityService.GetByIdAsync(id);
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
            var returnResult = new ReturnResult<PagedData<SelectCommunityDTO, string>>();
            try
            {
                returnResult = await _communityService.GetPageAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateCommunityDTO updateDTO)
        {
            var returnResult = new ReturnResult<SelectCommunityDTO>();
            try
            {
                returnResult = await _communityService.UpdateAsync(updateDTO);
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
                returnResult = await _communityService.DeleteByIdAsync(id);
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
                returnResult = await _communityService.DeleteByIdsAsync(page.Selected);
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
