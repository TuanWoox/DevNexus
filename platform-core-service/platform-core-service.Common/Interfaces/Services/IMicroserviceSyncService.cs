using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IMicroserviceSyncService
    {
        // Count endpoints
        Task<ReturnResult<int>> GetProfilesCountAsync();
        Task<ReturnResult<int>> GetProfileBlocksCountAsync();
        Task<ReturnResult<int>> GetUserFollowsCountAsync();

        // Paging endpoints (filters out IDs in page.Selected)
        Task<ReturnResult<PagedData<ProfileSyncDTO, string>>> GetProfilesSnapshotAsync(Page<string> page);
        Task<ReturnResult<PagedData<ProfileBlockSyncDTO, string>>> GetProfileBlocksSnapshotAsync(Page<string> page);
        Task<ReturnResult<PagedData<UserFollowSyncDTO, string>>> GetUserFollowsSnapshotAsync(Page<string> page);
    }
}
