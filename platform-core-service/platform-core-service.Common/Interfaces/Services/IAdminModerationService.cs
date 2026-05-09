using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminModerationService
    {
        Task<ReturnResult<PagedData<AdminQueueEntryDTO, string>>> GetPendingQueueAsync(Page<string> page);

        Task<ReturnResult<bool>> ApproveAsync(AdminQueueResolveDTO dto);

        Task<ReturnResult<bool>> RejectAsync(AdminQueueResolveDTO dto);
    }
}
