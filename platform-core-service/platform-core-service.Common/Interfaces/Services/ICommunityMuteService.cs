using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMuteService
    {
        Task<ReturnResult<MuteStatusDTO>> GetMuteStatusAsync(string communityId);
    }
}
