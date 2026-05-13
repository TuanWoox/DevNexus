using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IModerationService
    {
        /// <summary>
        /// Handles the callback from AI Worker after pipeline completes.
        /// Updates Post.ModerationStatus and creates a PostModerationResult audit row.
        /// Idempotent — safe to call multiple times for the same postId.
        /// </summary>
        Task<ReturnResult<bool>> HandleCallbackAsync(ModerationCallbackDTO dto);

        /// <summary>
        /// Creates a ModerationQueueEntry for Tier-3 gray-zone posts awaiting human review.
        /// Returns the generated entry ID so AI Worker can store it as queue_entry_id.
        /// </summary>
        Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueForReviewAsync(ModerationQueueRequestDTO dto);

        /// <summary>
        /// Sends a locally detected banned-keyword post to human review without using the AI worker.
        /// </summary>
        Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueBannedKeywordReviewAsync(string postId, IReadOnlyCollection<string> matchedKeywords);
    }
}
