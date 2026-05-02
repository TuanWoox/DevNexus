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
}
