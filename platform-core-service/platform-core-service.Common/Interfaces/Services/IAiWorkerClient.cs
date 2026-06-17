using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Interfaces.Services
{
    /// <summary>
    /// HTTP client for calling the Python AI Worker service.
    /// </summary>
    public interface IAiWorkerClient
    {
        /// <summary>
        /// Sends POST /ai/moderation/submit and throws if the worker rejects the request.
        /// </summary>
        Task SubmitForModerationAsync(ModerationTargetType targetType, string targetId, string? title, string textContent, int moderationVersion, string contentHash, IReadOnlyCollection<ModerationMediaManifestItemDTO> mediaManifest);
        Task<ReturnResult<AISummarizeResponseDTO>> SummarizeContentAsync(AISummarizeRequestDTO request);
        Task<ReturnResult<AIMetadataResponseDTO>> SuggestMetadataAsync(AIMetadataRequestDTO request);
        Task<ReturnResult<AICodeExplainResponseDTO>> ExplainCodeAsync(AICodeExplainRequestDTO request);
        Task<ReturnResult<AICodeDiagramResponseDTO>> GenerateCodeDiagramAsync(AICodeDiagramRequestDTO request);
        Task<ReturnResult<AIBatchEmbeddingResponseDTO>> GetRecommendationEmbeddingsAsync(AIBatchEmbeddingRequestDTO request);
        Task<ReturnResult<bool>> UpdateUsageInteractionAsync(int usageLogId, AIUsageInteractionUpdateRequestDTO request);
        Task<ReturnResult<AiUsageLogPageResponseDTO>> GetPageAiUsageLogsAsync(Page<string> page);
        Task<ReturnResult<AdminAiUsageSummaryDTO>> GetSummaryAsync(DateOnly from, DateOnly to);
    }
}
