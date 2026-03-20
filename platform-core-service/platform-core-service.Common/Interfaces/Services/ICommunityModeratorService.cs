using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator;
using platform_core_service.Common.Models.Paging;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityModeratorService
    {
        Task<ReturnResult<SelectCommunityModeratorDTO>> AddAsync(CreateCommunityModeratorDTO createDTO);
        Task<ReturnResult<bool>> RemoveAsync(string moderatorEntryId);
        Task<ReturnResult<PagedData<SelectCommunityModeratorDTO, string>>> GetByCommunityAsync(string communityId, Page<string> page);
    }
}
