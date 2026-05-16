using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAiContentService
    {
        Task<ReturnResult<AIMetadataResponseDTO>> SuggestMetadataAsync(AIMetadataRequestDTO request);
        Task<ReturnResult<SummarizePostResponseDTO>> SummarizePostAsync(string postId, SummarizePostRequestDTO request);
    }
}
