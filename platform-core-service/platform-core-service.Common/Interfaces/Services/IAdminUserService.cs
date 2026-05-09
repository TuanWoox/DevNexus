using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminUserService
    {
        Task<ReturnResult<PagedData<AdminProfileDTO, string>>> GetAllUsersAsync(Page<string> page);
        Task<ReturnResult<bool>> SuspendUserAsync(string profileId, AdminSuspendUserDTO dto);
        Task<ReturnResult<bool>> UnsuspendUserAsync(string profileId);
        Task<ReturnResult<bool>> UpdateRoleAsync(string userId, string newRole);
    }
}
