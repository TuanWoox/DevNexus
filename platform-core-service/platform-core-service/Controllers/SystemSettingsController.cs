using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly IConfigurationService _configService;

        public SystemSettingsController(IConfigurationService configService)
        {
            _configService = configService;
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetSettings(Page<string> page)
        {
            ReturnResult<PagedData<SelectSettingDTO, string>> rs = await _configService.GetPaging(page);
            return Ok(rs);
        }
        [HttpGet("single")]
        public async Task<IActionResult> GetOneByKeyAndGroup(string key, string group)
        {
            ReturnResult<SelectSettingDTO> result = await _configService.GetOneByKeyAndGroup(key, group);
            return Ok(result);
        }
        [HttpPost]
        public async Task<IActionResult> CreateSetting(CreateSettingDTO createDto)
        {
            ReturnResult<bool> rs = await _configService.CreateSettingAsync(createDto);
            return Ok(rs);
        }
        [HttpDelete]
        public async Task<IActionResult> DeleteSettings([FromBody] List<string> ids)
        {
            ReturnResult<bool> rs = await _configService.DeleteSettingsAsync(ids);
            return Ok(rs);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateSetting(UpdateSettingDTO updateDto)
        {
            ReturnResult<bool> rs = await _configService.UpdateSettingAsync(updateDto);
            return Ok(rs);
        }
    }
}