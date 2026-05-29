namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Result of a local banned-keyword risk precheck.
    /// Returned by <see cref="Interfaces.Services.IContentRiskPrecheckService.CheckAsync"/>.
    /// Pure data — no side effects, no entity mutation.
    /// </summary>
    public sealed class ContentRiskPrecheckResult
    {
        public bool HasBannedKeywords { get; init; }
        public IReadOnlyList<string> MatchedBannedKeywords { get; init; } = [];
        public string? ModerationReason { get; init; }

        /// <summary>
        /// Shared singleton for the common case where content is clean.
        /// Avoids allocation on every clean-content create/update.
        /// </summary>
        public static ContentRiskPrecheckResult Clean { get; } = new()
        {
            HasBannedKeywords = false,
            MatchedBannedKeywords = [],
            ModerationReason = null,
        };
    }
}
