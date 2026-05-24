using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMuteService
    {
        Task<ReturnResult<MuteStatusDTO>> GetMuteStatusAsync(string communityId);
        Task<ReturnResult<MuteStatusDTO>> GetProfileMuteStatusAsync(string communityId, string targetProfileId);
        Task<ReturnResult<SelectCommunityMuteDTO>> MuteMemberAsync(CreateCommunityMuteDTO createDTO);
        Task<ReturnResult<bool>> UnmuteMemberAsync(string muteId);
        Task<ReturnResult<bool>> UnmuteProfileAsync(string communityId, string targetProfileId);
        Task<ReturnResult<PagedData<SelectCommunityMuteDTO, string>>> GetMutedMembersAsync(string communityId, Page<string> page);
    }
}
