using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CommunityMediaController : ControllerBase
    {
        private ICommunityMediaService _communityMediaService { get; set; }
        public CommunityMediaController(ICommunityMediaService communityMediaService)
        {
            _communityMediaService = communityMediaService;
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById([TrimmedRequired] string id)
        {
            try
            {
                string fileDestination = await _communityMediaService.GetById(id);
                if (string.IsNullOrEmpty(fileDestination)) return NotFound();
                if (!System.IO.File.Exists(fileDestination)) return NotFound();
                new FileExtensionContentTypeProvider().TryGetContentType(fileDestination, out string? contentType);
                contentType ??= "application/octet-stream";
                return PhysicalFile(fileDestination, contentType, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("paging/{communityId}")]
        public async Task<IActionResult> GetPaging([TrimmedRequired] string communityId, Page<string> page)
        {
            ReturnResult<PagedData<SelectCommunityMediaDTO, string>> returnResult = new();
            try
            {
                returnResult = await _communityMediaService.GetPaging(communityId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateCommunityMediaDTO createCommunityMedia)
        {
            ReturnResult<SelectCommunityMediaDTO> returnResult = new();
            try
            {
                returnResult = await _communityMediaService.Create(createCommunityMedia);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpPatch("primary")]
        public async Task<IActionResult> UpdatePrimary([FromBody] UpdatePrimaryCommunityMediaDTO updatePrimaryCommunityMedia)
        {
            ReturnResult<SelectCommunityMediaDTO> returnResult = new();
            try
            {
                returnResult = await _communityMediaService.UpdatePrimary(updatePrimaryCommunityMedia);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete([TrimmedRequired] string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _communityMediaService.Delete(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDelete([FromBody] List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _communityMediaService.BulkDelete(ids);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }
    }
}
