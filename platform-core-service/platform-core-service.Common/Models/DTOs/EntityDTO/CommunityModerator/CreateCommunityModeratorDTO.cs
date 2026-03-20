using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator
{
    public class CreateCommunityModeratorDTO
    {
        [Required(ErrorMessage = "ModeratorId is required")]
        public string ModeratorId { get; set; } = null!;

        [Required(ErrorMessage = "CommunityId is required")]
        public string CommunityId { get; set; } = null!;
    }
}
