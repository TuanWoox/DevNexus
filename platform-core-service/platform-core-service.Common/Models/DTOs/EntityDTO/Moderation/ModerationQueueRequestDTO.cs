using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Payload sent by AI Worker to POST /internal/moderation/queue (Tier 3 only).
    /// Creates a human review queue entry.
    /// </summary>
    public class ModerationQueueRequestDTO
    {
        [Required]
        public ModerationTargetType TargetType { get; set; }

        [Required]
        public string? TargetId { get; set; }

        public int? ModerationVersion { get; set; }

        [MaxLength(128)]
        public string? ContentHash { get; set; }

        [Required]
        [MaxLength(255)]
        public string Reason { get; set; } = null!;

        public float Tier1Score { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Tier2Reasoning { get; set; } = null!;
    }
}
