using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.Paging;
using shared_contracts.Models.DTOs.HelperDTO;


namespace platform_core_service.Common.Interfaces.Services
{
    public interface IConfigurationService
    {
        Task<AppConfiguration> GetConfigAsync();
        Task<ReturnResult<bool>> CreateSettingAsync(CreateSettingDTO createDto);
        Task<ReturnResult<PagedData<SelectSettingDTO, string>>> GetPaging(Page<string> page);
        Task<ReturnResult<bool>> DeleteSettingsAsync(List<string> ids);
        Task<ReturnResult<bool>> UpdateSettingAsync(UpdateSettingDTO updateDto);
    }
}
