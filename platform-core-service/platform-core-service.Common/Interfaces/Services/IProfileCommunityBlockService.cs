using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IProfileCommunityBlockService
    {
        Task<ReturnResult<SelectProfileCommunityBlock>> CreateAsync(CreateProfileCommunityBlock createBlock);
        Task<ReturnResult<PagedData<SelectProfileCommunityBlock, string>>> GetPagingAsync(Page<string> page);
        Task<ReturnResult<bool>> DeleteById(string id);
        Task<ReturnResult<int>> DeleteByIds(List<string> ids);
    }
}
