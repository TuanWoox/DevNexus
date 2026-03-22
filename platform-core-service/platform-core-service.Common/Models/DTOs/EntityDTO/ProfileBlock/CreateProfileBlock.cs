using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock
{
    public class CreateProfileBlock
    {
        [Required]
        [StringLength(256)]
        public string BlockedProfileId { get; set; } = null!;

    }
}