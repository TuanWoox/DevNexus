using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Payload sent by AI Worker to POST /internal/moderation/queue (Tier 3 only).
    /// Creates a human review queue entry.
    /// </summary>
    public class ModerationQueueRequestDTO
    {
        [Required]
        public string PostId { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string Reason { get; set; } = null!;

        public float Tier1Score { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Tier2Reasoning { get; set; } = null!;
    }
}
