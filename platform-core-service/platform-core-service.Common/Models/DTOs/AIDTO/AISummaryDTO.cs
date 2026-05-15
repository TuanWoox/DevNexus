using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    // ─── AI Worker contract ───────────────────────────────────────────────────
    // Maps directly to POST /ai/content/summarize on the Python ai-worker.

    public class AISummarizeRequestDTO
    {
        [JsonProperty("content")]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonProperty("language")]
        [JsonPropertyName("language")]
        public string Language { get; set; } = "vi";
    }

    public class AISummarizeResponseDTO
    {
        [JsonProperty("summary_points")]
        [JsonPropertyName("summary_points")]
        public List<string> SummaryPoints { get; set; } = [];

        [JsonProperty("estimated_read_time_seconds")]
        [JsonPropertyName("estimated_read_time_seconds")]
        public int EstimatedReadTimeSeconds { get; set; }
    }

    // ─── Frontend contract ───────────────────────────────────────────────────
    // Contract between platform-core-service and the React frontend.

    public class SummarizePostRequestDTO
    {
        public string Language { get; set; } = "vi";
    }

    public class SummarizePostResponseDTO
    {
        public string PostId { get; set; } = string.Empty;
        public List<string> SummaryPoints { get; set; } = [];

        /// <summary>Original post estimated read time (seconds) from ai-worker.</summary>
        public int OriginalEstimatedReadTimeSeconds { get; set; }

        /// <summary>Hard-coded at 60 s for Phase 1; Phase 2 will compute from bullet count.</summary>
        public int SummaryEstimatedReadTimeSeconds { get; set; } = 60;

        /// <summary>Always false in Phase 1 — keeps the frontend contract ready for Phase 2 cache.</summary>
        public bool Cached { get; set; } = false;
    }
}
