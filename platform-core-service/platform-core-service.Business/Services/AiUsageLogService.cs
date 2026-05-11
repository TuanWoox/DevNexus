using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Services
{
    public class AiUsageLogService : IAiUsageLogService
    {
        private readonly IAiWorkerClient _aiWorkerClient;
        public AiUsageLogService(IAiWorkerClient aiWorkerClient)
        {
            _aiWorkerClient = aiWorkerClient;
        }
        public async Task<ReturnResult<AiUsageLogPageResponseDTO>> GetLogsAsync(Page<string> page)
        {
            ReturnResult<AiUsageLogPageResponseDTO> returnResult = new();
            try
            {
                // Guard inputs before forwarding
                page.Size = Math.Clamp(page.Size, 1, 100);
                page.PageNumber = Math.Max(page.PageNumber, 1);
                returnResult = await _aiWorkerClient.GetPageAiUsageLogsAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiUsageLogService] {ex.Message}");
                returnResult.Message = $"An error occurred while fetching AI usage logs: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<AdminAiUsageSummaryDTO>> GetSummaryAsync(DateOnly from, DateOnly to)
        {
            ReturnResult<AdminAiUsageSummaryDTO> returnResult = new();
            try
            {
                returnResult = await _aiWorkerClient.GetSummaryAsync(from, to);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiUsageLogService] GetSummaryAsync: {ex.Message}");
                returnResult.Message = $"An error occurred while fetching AI usage summary: {ex.Message}";
            }
            return returnResult;
        }
    }

}
