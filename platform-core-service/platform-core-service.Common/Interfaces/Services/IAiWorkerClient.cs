using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    /// <summary>
    /// Fire-and-forget HTTP client for calling the Python AI Worker service.
    /// Never throws — logs errors internally so callers are never disrupted.
    /// </summary>
    public interface IAiWorkerClient
    {
        /// <summary>
        /// Submits a newly created post to the AI Worker's moderation pipeline.
        /// Sends POST /ai/moderation/submit as a fire-and-forget call.
        /// </summary>
        /// <param name="postId">The ID of the post to moderate.</param>
        /// <param name="title">The post title.</param>
        /// <param name="textContent">The full markdown/text body of the post.</param>
        Task SubmitForModerationAsync(string postId, string title, string textContent);
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
