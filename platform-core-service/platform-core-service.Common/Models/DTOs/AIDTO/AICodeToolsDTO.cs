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

        [JsonProperty("post_id")]
        [JsonPropertyName("post_id")]
        public string? PostId { get; set; }
    }

    public class AICodeExplainResponseDTO
    {
        [JsonProperty("purpose")]
        [JsonPropertyName("purpose")]
        public string Purpose { get; set; } = string.Empty;

        [JsonProperty("how_it_works")]
        [JsonPropertyName("how_it_works")]
        public List<string> HowItWorks { get; set; } = [];

        [JsonProperty("important_details")]
        [JsonPropertyName("important_details")]
        public List<string> ImportantDetails { get; set; } = [];

        [JsonProperty("potential_issues")]
        [JsonPropertyName("potential_issues")]
        public List<string> PotentialIssues { get; set; } = [];

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

        [JsonProperty("diagram_type")]
        [JsonPropertyName("diagram_type")]
        public string DiagramType { get; set; } = "auto";

        [JsonProperty("post_id")]
        [JsonPropertyName("post_id")]
        public string? PostId { get; set; }
    }

    public class AICodeDiagramResponseDTO
    {
        [JsonProperty("mermaid_syntax")]
        [JsonPropertyName("mermaid_syntax")]
        public string MermaidCode { get; set; } = string.Empty;

        [JsonProperty("diagram_type")]
        [JsonPropertyName("diagram_type")]
        public string DiagramType { get; set; } = "flowchart";
    }
}
