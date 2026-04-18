using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using platform_core_service.Business.Services;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileMediaController : ControllerBase
    {
        private IProfileMediaService _profileMediaService { get; set; }
        public ProfileMediaController(IProfileMediaService profileMediaService)
        {
            _profileMediaService = profileMediaService;
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById([TrimmedRequired] string id)
        {
            try
            {
                string fileDestination = await _profileMediaService.GetById(id);
                if (string.IsNullOrEmpty(fileDestination)) return NotFound();
                if (!System.IO.File.Exists(fileDestination)) return NotFound();
                new FileExtensionContentTypeProvider().TryGetContentType(fileDestination, out string? contentType);
                contentType ??= "application/octet-stream";
                //Enable stream process
                return PhysicalFile(fileDestination, contentType, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("paging/{profileId}")]
        public async Task<IActionResult> GetPaging([TrimmedRequired] string profileId, [FromQuery] Page<string> page)
        {
            ReturnResult<PagedData<SelectProfileMediaDTO, string>> returnResult = new();
            try
            {
                returnResult = await _profileMediaService.GetPaging(profileId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateProfileMediaDTO createProfileMedia)
        {
            ReturnResult<SelectProfileMediaDTO> returnResult = new();
            try
            {
                returnResult = await _profileMediaService.Create(createProfileMedia);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }

        [HttpPatch("primary")]
        public async Task<IActionResult> UpdatePrimary([FromBody] UpdatePrimaryProfileMediaDTO updatePrimaryProfileMedia)
        {
            ReturnResult<SelectProfileMediaDTO> returnResult = new();
            try
            {
                returnResult = await _profileMediaService.UpdatePrimary(updatePrimaryProfileMedia);
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
                returnResult = await _profileMediaService.Delete(id);
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
                returnResult = await _profileMediaService.BulkDelete(ids);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return Ok(returnResult);
        }
    }
}
