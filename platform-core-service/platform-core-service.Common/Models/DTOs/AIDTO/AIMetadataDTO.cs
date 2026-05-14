using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    public class AIMetadataRequestDTO
    {
        [JsonProperty("markdown_content")]
        [JsonPropertyName("markdown_content")]
        public string MarkdownContent { get; set; } = string.Empty;
    }

    public class AIMetadataResponseDTO
    {
        [JsonProperty("suggested_title")]
        [JsonPropertyName("suggested_title")]
        public string SuggestedTitle { get; set; } = string.Empty;

        [JsonProperty("suggested_tags")]
        [JsonPropertyName("suggested_tags")]
        public List<string> SuggestedTags { get; set; } = [];

        [JsonProperty("usage_log_id")]
        [JsonPropertyName("usage_log_id")]
        public int? UsageLogId { get; set; }
    }

    public class AIUsageInteractionUpdateRequestDTO
    {
        [JsonProperty("interaction_status")]
        [JsonPropertyName("interaction_status")]
        public string InteractionStatus { get; set; } = string.Empty;

        [JsonProperty("metadata_json_patch")]
        [JsonPropertyName("metadata_json_patch")]
        public Dictionary<string, object>? MetadataJsonPatch { get; set; }
    }
}
