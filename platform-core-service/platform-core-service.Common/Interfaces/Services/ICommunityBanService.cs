using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityBanService
    {
        Task<ReturnResult<SelectCommunityBanDTO>> BanMemberAsync(CreateCommunityBanDTO createDTO);
        Task<ReturnResult<SelectCommunityBanDTO>> GetProfileBanStatusAsync(string communityId, string targetProfileId);
        Task<ReturnResult<bool>> UnbanMemberAsync(string banId);
        Task<ReturnResult<bool>> UnbanProfileAsync(string communityId, string targetProfileId);
        Task<ReturnResult<PagedData<SelectCommunityBanDTO, string>>> GetBansAsync(string communityId, Page<string> page);
    }
}
