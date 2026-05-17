using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminAuditLogService
    {
        Task AddAsync(CreateAdminAuditLogDTO dto, CancellationToken cancellationToken = default);
        Task<ReturnResult<PagedData<AdminAuditLogDTO, string>>> GetPagingAsync(Page<string> page);
    }
}
