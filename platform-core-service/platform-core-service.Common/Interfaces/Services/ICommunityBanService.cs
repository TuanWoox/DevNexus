using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityBanService
    {
        Task<ReturnResult<SelectCommunityBanDTO>> BanMemberAsync(CreateCommunityBanDTO createDTO);
        Task<ReturnResult<bool>> UnbanMemberAsync(string banId);
        Task<ReturnResult<PagedData<SelectCommunityBanDTO, string>>> GetBansAsync(string communityId, Page<string> page);
    }
}
