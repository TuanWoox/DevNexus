using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAiUsageLogService
    {
        Task<ReturnResult<AiUsageLogPageResponseDTO>> GetLogsAsync(Page<string> page);

    }
}
