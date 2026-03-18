using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IProfileService
    {
        Task<ReturnResult<bool>> CreateAsync(CreateProfileDTO createDTO, ApplicationUser? user);
        Task<ReturnResult<SelectProfileDTO>> UpdateAsync(UpdateProfileDTO updateDTO);
        Task<ReturnResult<SelectProfileDTO>> GetAsync(string profileId);
    }
}
