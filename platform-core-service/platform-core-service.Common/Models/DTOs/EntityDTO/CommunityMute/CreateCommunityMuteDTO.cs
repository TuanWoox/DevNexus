using System;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute
{
    public class CreateCommunityMuteDTO
    {
        [Required]
        public string CommunityId { get; set; } = null!;// Muted target community

        [Required]
        public string MutedProfileId { get; set; } = null!;// Profile getting muted

        public DateTimeOffset? MutedUntil { get; set; }// Expiration of mute (null = permanent)

        [StringLength(500)]
        public string? MuteReason { get; set; }// Optional reason for mute
    }
}
