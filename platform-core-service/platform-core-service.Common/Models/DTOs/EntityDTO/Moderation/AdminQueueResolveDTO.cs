using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Write DTO — sent by admin to approve or reject a ModerationQueueEntry.
    /// </summary>
    public class AdminQueueResolveDTO
    {
        [Required]
        public string Id { get; set; } = null!;

        /// <summary>"Approved" or "Rejected"</summary>
        [Required]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Resolution must be 'Approved' or 'Rejected'")]
        public string Resolution { get; set; } = null!;

        [MaxLength(500)]
        public string? ModeratorNote { get; set; }
    }
}
