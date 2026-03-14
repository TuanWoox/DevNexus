using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly IConfigurationService _configService;

        public SystemSettingsController(IConfigurationService configService)
        {
            _configService = configService;
        }

        [HttpPost("GetPaging")]
        public async Task<IActionResult> GetSettings(Page<string> page)
        {
            ReturnResult<PagedData<SelectSettingDTO, string>> rs = new ReturnResult<PagedData<SelectSettingDTO, string>>();
            try
            {
                rs = await _configService.GetPaging(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                rs.Message = ex.Message;
            }
            return Ok(rs);
        }
        [HttpPost]
        public async Task<IActionResult> CreateSetting(CreateSettingDTO createDto)
        {
            ReturnResult<bool> rs = new ReturnResult<bool>();
            try
            {
                rs = await _configService.CreateSettingAsync(createDto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                rs.Message = ex.Message;
            }
            return Ok(rs);
        }
        [HttpDelete]
        public async Task<IActionResult> DeleteSettings([FromBody] List<string> ids)
        {
            ReturnResult<bool> rs = new ReturnResult<bool>();
            try
            {
                rs = await _configService.DeleteSettingsAsync(ids);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                rs.Message = ex.Message;
            }
            return Ok(rs);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateSetting(UpdateSettingDTO updateDto)
        {
            ReturnResult<bool> rs = new ReturnResult<bool>();
            try
            {
                rs = await _configService.UpdateSettingAsync(updateDto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                rs.Message = ex.Message;
            }
            return Ok(rs);
        }
    }
}