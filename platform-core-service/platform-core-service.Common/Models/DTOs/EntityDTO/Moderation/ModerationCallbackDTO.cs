using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Payload sent by AI Worker to POST /internal/moderation/callback.
    /// Carries the final decision after the 3-tier pipeline completes.
    /// </summary>
    public class ModerationCallbackDTO
    {
        [Required]
        public string PostId { get; set; } = null!;

        /// <summary>
        /// One of: "approve", "flag", "escalate"
        /// Maps to AI Worker's ModerationDecision enum string values.
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Decision { get; set; } = null!;

        // AI score fields — optional, stored for audit/debug purposes
        public float? TextScore { get; set; }
        public float? ImageScore { get; set; }
        public float? CombinedScore { get; set; }

        [MaxLength(1000)]
        public string? Reasoning { get; set; }
    }
}
