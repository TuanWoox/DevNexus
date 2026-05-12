using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityService
    {
        Task<ReturnResult<SelectCommunityDTO>> CreateAsync(CreateCommunityDTO createDTO);
        Task<ReturnResult<SelectCommunityDTO>> GetByIdAsync(string communityId);
        Task<ReturnResult<PagedData<SelectCommunityDTO, string>>> GetPageAsync(CommunityPageRequest request);
        Task<ReturnResult<SelectCommunityDTO>> UpdateAsync(UpdateCommunityDTO updateDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string communityId);
        Task<ReturnResult<int>> DeleteByIdsAsync(List<string> communityIds);
        Task<ReturnResult<SelectCommunityDTO>> UpdateCommunityCoverPhotoUrl(string communityId, string mediaId);
    }
}
