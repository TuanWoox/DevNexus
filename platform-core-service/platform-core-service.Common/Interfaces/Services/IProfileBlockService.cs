using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IProfileBlockService
    {
        public Task<ReturnResult<PagedData<SelectProfileBlock, string>>> GetPagingAsync(Page<string> page);
        public Task<ReturnResult<SelectProfileBlock>> CreateAsync(CreateProfileBlock createProfileBlock);
        public Task<ReturnResult<bool>> DeleteById(string id);
        public Task<ReturnResult<int>> DeleteByIds(List<string> ids);
        public Task<ReturnResult<SelectBlockStatus>> GetBlockStatusAsync(string otherProfileId);
        // public Task<ReturnResult<bool>> DeleteByBlockProfileIdAsync(string blockedProfileId);

    }
}