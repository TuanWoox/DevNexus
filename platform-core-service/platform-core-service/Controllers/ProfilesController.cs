using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfilesController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfilesController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            ReturnResult<SelectProfileDTO> returnResult = new ReturnResult<SelectProfileDTO>();
            try
            {
                returnResult = await _profileService.GetAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
        [HttpPost]
        [AllowWithoutProfile]
        public async Task<IActionResult> Create(CreateProfileDTO createDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _profileService.CreateAsync(createDTO, null);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
        [HttpPut]
        public async Task<IActionResult> Update(UpdateProfileDTO updateDTO)
        {
            ReturnResult<SelectProfileDTO> returnResult = new ReturnResult<SelectProfileDTO>();
            try
            {
                returnResult = await _profileService.UpdateAsync(updateDTO);
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
