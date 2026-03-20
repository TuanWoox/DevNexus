using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember
{
    public class CreateCommunityBanDTO
    {
        [Required]
        public string CommunityId { get; set; } = null!;

        [Required]
        public string BannedProfileId { get; set; } = null!;

        [StringLength(500)]
        public string? BanReason { get; set; }
    }
}
