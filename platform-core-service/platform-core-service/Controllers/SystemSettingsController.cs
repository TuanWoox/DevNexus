using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using System.Text.Json;

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

        [HttpGet("moderation/banned-keywords")]
        public async Task<IActionResult> GetBannedKeywords()
        {
            ReturnResult<BannedKeywordsDTO> returnResult = new();
            try
            {
                var settingResult = await _configService.GetOneByKeyAndGroup("BannedKeywords", "Moderation");
                if (settingResult.Result != null)
                {
                    var keywords = ParseJsonArray(settingResult.Result.Value);
                    returnResult.Result = new BannedKeywordsDTO { Keywords = keywords };
                }
                else
                {
                    returnResult.Result = new BannedKeywordsDTO { Keywords = new List<string>() };
                }
            }
            catch (Exception ex)
            {
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPut("moderation/banned-keywords")]
        public async Task<IActionResult> UpdateBannedKeywords([FromBody] BannedKeywordsDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var json = JsonSerializer.Serialize(dto.Keywords ?? new List<string>());
                var existing = await _configService.GetOneByKeyAndGroup("BannedKeywords", "Moderation");
                if (existing.Result != null)
                {
                    returnResult = await _configService.UpdateSettingAsync(new UpdateSettingDTO
                    {
                        Id = existing.Result.Id,
                        Key = "BannedKeywords",
                        Group = "Moderation",
                        Value = json,
                        DataType = SettingDataType.String,
                        IsSensitive = false,
                        Description = "Banned keywords for content moderation (JSON array)"
                    });
                }
                else
                {
                    returnResult = await _configService.CreateSettingAsync(new CreateSettingDTO
                    {
                        Key = "BannedKeywords",
                        Group = "Moderation",
                        Value = json,
                        DataType = SettingDataType.String,
                        IsSensitive = false,
                        Description = "Banned keywords for content moderation (JSON array)"
                    });
                }
            }
            catch (Exception ex)
            {
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        private static List<string> ParseJsonArray(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
            catch { return new List<string>(); }
        }
    }
}