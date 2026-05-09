using System.Text.Json.Serialization;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog
{
    public class AiUsageLogDTO
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("feature_name")]
        public string FeatureName { get; set; } = null!;

        [JsonPropertyName("model_used")]
        public string ModelUsed { get; set; } = null!;

        [JsonPropertyName("input_tokens")]
        public int InputTokens { get; set; }

        [JsonPropertyName("output_tokens")]
        public int OutputTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }

        [JsonPropertyName("user_id")]
        public string? UserId { get; set; }

        [JsonPropertyName("created_at")]
        public DateTimeOffset CreatedAt { get; set; }
    }

    // --- Phase 7: AI Usage Summary DTOs ---

    public class AiUsageByModelDTO
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("call_count")]
        public int CallCount { get; set; }

        [JsonPropertyName("input_tokens")]
        public int InputTokens { get; set; }

        [JsonPropertyName("output_tokens")]
        public int OutputTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }

    public class AiUsageByFeatureDTO
    {
        [JsonPropertyName("feature")]
        public string Feature { get; set; } = string.Empty;

        [JsonPropertyName("call_count")]
        public int CallCount { get; set; }

        [JsonPropertyName("input_tokens")]
        public int InputTokens { get; set; }

        [JsonPropertyName("output_tokens")]
        public int OutputTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }

    public class AiUsageByDateDTO
    {
        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;  // "YYYY-MM-DD"

        [JsonPropertyName("call_count")]
        public int CallCount { get; set; }

        [JsonPropertyName("input_tokens")]
        public int InputTokens { get; set; }

        [JsonPropertyName("output_tokens")]
        public int OutputTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }

    public class AdminAiUsageSummaryDTO
    {
        [JsonPropertyName("total_calls")]
        public int TotalCalls { get; set; }

        [JsonPropertyName("total_input_tokens")]
        public int TotalInputTokens { get; set; }

        [JsonPropertyName("total_output_tokens")]
        public int TotalOutputTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }

        [JsonPropertyName("by_model")]
        public List<AiUsageByModelDTO> ByModel { get; set; } = new();

        [JsonPropertyName("by_feature")]
        public List<AiUsageByFeatureDTO> ByFeature { get; set; } = new();

        [JsonPropertyName("by_date")]
        public List<AiUsageByDateDTO> ByDate { get; set; } = new();
    }
}
