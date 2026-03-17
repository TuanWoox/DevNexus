using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IProfileService
    {
        Task<ReturnResult<TokenResponseDTO>> CreateAsync(CreateProfileDTO createDTO);
        Task<ReturnResult<SelectProfileDTO>> UpdateAsync(UpdateProfileDTO updateDTO);
        Task<ReturnResult<SelectProfileDTO>> GetAsync(string profileId);
    }
}
