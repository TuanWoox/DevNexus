using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock
{
    public class CreateProfileCommunityBlock
    {
        [Required]
        [StringLength(256)]
        public string CommunityId { get; set; } = null!;
    }
}
