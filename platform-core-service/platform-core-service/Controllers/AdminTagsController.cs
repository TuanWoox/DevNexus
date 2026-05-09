using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Tag;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Admin/Moderator endpoints for managing tags.
    /// Route prefix: api/admintags
    /// </summary>
    [Authorize(Roles = "Admin,Moderator")]
    [ApiController]
    [Route("api/admintags")]
    public class AdminTagsController : ControllerBase
    {
        private readonly IAdminTagService _adminTagService;

        public AdminTagsController(IAdminTagService adminTagService)
        {
            _adminTagService = adminTagService;
        }

        /// <summary>
        /// POST api/admintags/paging
        /// Returns a paginated list of tags with post counts.
        /// </summary>
        [HttpPost("paging")]
        public async Task<IActionResult> GetPaging([FromBody] Page<string> page)
        {
            ReturnResult<PagedData<SelectTagDTO, string>> returnResult = new();
            try
            {
                returnResult = await _adminTagService.GetPagingAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/admintags/create
        /// Creates a new tag.
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateTagDTO dto)
        {
            ReturnResult<SelectTagDTO> returnResult = new();
            try
            {
                returnResult = await _adminTagService.CreateAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// PUT api/admintags/update
        /// Updates an existing tag's name.
        /// </summary>
        [HttpPut("update")]
        public async Task<IActionResult> Update([FromBody] UpdateTagDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminTagService.UpdateAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// DELETE api/admintags/{id}
        /// Soft-deletes a tag. Blocked if the tag is in use by any post.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminTagService.DeleteAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/admintags/merge
        /// Merges source tag into target tag. Moves all PostTag rows; soft-deletes source.
        /// </summary>
        [HttpPost("merge")]
        public async Task<IActionResult> Merge([FromBody] MergeTagsDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminTagService.MergeAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
