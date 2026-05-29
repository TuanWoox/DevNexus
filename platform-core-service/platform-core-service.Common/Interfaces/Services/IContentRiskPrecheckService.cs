using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;

namespace platform_core_service.Common.Interfaces.Services
{
    /// <summary>
    /// Checks content against the configured banned keyword list.
    /// Read-only — does NOT modify entities, save to DB, or enqueue jobs.
    /// </summary>
    public interface IContentRiskPrecheckService
    {
        /// <summary>
        /// Checks title and content against the configured banned keyword list.
        /// Returns which keywords matched (if any) and a pre-formatted ModerationReason.
        /// </summary>
        Task<ContentRiskPrecheckResult> CheckAsync(string? title, string? content);
    }
}
