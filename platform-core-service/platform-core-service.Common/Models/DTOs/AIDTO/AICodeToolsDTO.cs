using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    public class AICodeExplainRequestDTO
    {
        [JsonProperty("code")]
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonProperty("language")]
        [JsonPropertyName("language")]
        public string? Language { get; set; } = "auto";

        [JsonPropertyName("post_id")]
        public string? PostId { get; set; }
    }

    public class AICodeExplainResponseDTO
    {
        [JsonProperty("summary")]
        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonProperty("key_flow")]
        [JsonPropertyName("key_flow")]
        public List<string> KeyFlow { get; set; } = [];

        [JsonProperty("watch_out")]
        [JsonPropertyName("watch_out")]
        public List<string> WatchOut { get; set; } = [];

        [JsonProperty("details")]
        [JsonPropertyName("details")]
        public AICodeExplainDetailsDTO Details { get; set; } = new();

        public string Status { get; set; } = "Completed";

        public string? Message { get; set; }

        public bool Cached { get; set; }

        public DateTimeOffset? GeneratedAt { get; set; }
    }

    public class AICodeExplainDetailsDTO
    {
        [JsonProperty("important_details")]
        [JsonPropertyName("important_details")]
        public List<string> ImportantDetails { get; set; } = [];

        [JsonProperty("suggested_improvements")]
        [JsonPropertyName("suggested_improvements")]
        public List<string> SuggestedImprovements { get; set; } = [];

        [JsonProperty("concepts")]
        [JsonPropertyName("concepts")]
        public List<string> Concepts { get; set; } = [];

        [JsonProperty("complexity_rating")]
        [JsonPropertyName("complexity_rating")]
        public string ComplexityRating { get; set; } = "Medium";
    }

    public class AICodeDiagramRequestDTO
    {
        [JsonProperty("code")]
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonProperty("language")]
        [JsonPropertyName("language")]
        public string? Language { get; set; } = "auto";

        [JsonPropertyName("diagram_type")]
        public string DiagramType { get; set; } = "auto";

        [JsonPropertyName("post_id")]
        public string? PostId { get; set; }

        [JsonProperty("forceRegenerate")]
        [JsonPropertyName("forceRegenerate")]
        public bool ForceRegenerate { get; set; }
    }

    public class AICodeDiagramResponseDTO
    {
        [JsonProperty("mermaid_syntax")]
        [JsonPropertyName("mermaid_syntax")]
        public string MermaidCode { get; set; } = string.Empty;

        [JsonProperty("diagram_type")]
        [JsonPropertyName("diagram_type")]
        public string DiagramType { get; set; } = "flowchart";

        public string Status { get; set; } = "Completed";

        public string? Message { get; set; }

        public bool Cached { get; set; }

        public DateTimeOffset? GeneratedAt { get; set; }
    }
}
