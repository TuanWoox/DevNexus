using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace platform_core_service.Common.Interfaces.Services
{
    public interface IConfigurationService
    {
        Task<Dictionary<string, string>> GetAllSettingsDynamicAsync();
        Task<ReturnResult<SelectSettingDTO>> GetOneByKeyAndGroup(string key, string group);
        Task<ReturnResult<bool>> CreateSettingAsync(CreateSettingDTO createDto);
        Task<ReturnResult<PagedData<SelectSettingDTO, string>>> GetPaging(Page<string> page);
        Task<ReturnResult<bool>> DeleteSettingsAsync(List<string> ids);
        Task<ReturnResult<bool>> UpdateSettingAsync(UpdateSettingDTO updateDto);
        Task InitSetting();
    }
}
