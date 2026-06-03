using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;

namespace platform_core_service.Business.Services
{
    /// <summary>
    /// Shared banned-keyword risk precheck extracted from PostService and QAPostService.
    /// Logic moved verbatim — no behavioral changes.
    /// </summary>
    public sealed class ContentRiskPrecheckService : IContentRiskPrecheckService
    {
        private readonly IConfigurationService _configurationService;

        public ContentRiskPrecheckService(IConfigurationService configurationService)
        {
            _configurationService = configurationService;
        }

        public async Task<ContentRiskPrecheckResult> CheckAsync(string? title, string? content)
        {
            var bannedKeywords = await GetBannedKeywordsAsync();
            var matched = bannedKeywords
                .Where(k => !string.IsNullOrWhiteSpace(k) && (
                    (content ?? "").Contains(k, StringComparison.OrdinalIgnoreCase) ||
                    (title ?? "").Contains(k, StringComparison.OrdinalIgnoreCase)
                ))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (matched.Count == 0)
                return ContentRiskPrecheckResult.Clean;

            return new ContentRiskPrecheckResult
            {
                HasBannedKeywords = true,
                MatchedBannedKeywords = matched,
                ModerationReason = BuildBannedKeywordReason(matched),
            };
        }

        // ── Moved verbatim from PostService / QAPostService ─────────────────────

        private async Task<List<string>> GetBannedKeywordsAsync()
        {
            var settingResult = await _configurationService.GetOneByKeyAndGroup("BannedKeywords", "Moderation");
            if (settingResult.Result == null || string.IsNullOrEmpty(settingResult.Result.Value))
                return new List<string>();
            try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(settingResult.Result.Value) ?? new List<string>(); }
            catch { return new List<string>(); }
        }

        private static string BuildBannedKeywordReason(IReadOnlyCollection<string> matchedKeywords)
        {
            var keywordPreview = matchedKeywords.Where(k => !string.IsNullOrWhiteSpace(k)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var reason = keywordPreview.Any()
                ? $"Banned keywords detected: {string.Join(", ", keywordPreview)}"
                : "Banned keywords detected.";
            return reason.Length <= 1000 ? reason : reason[..1000];
        }
    }
}
