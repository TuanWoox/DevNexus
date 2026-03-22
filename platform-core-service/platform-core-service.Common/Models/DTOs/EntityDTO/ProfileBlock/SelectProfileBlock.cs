using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock
{
    public class SelectProfileBlock : IBaseKey<string>
    {
        public string Id { get; set; } = null!;

        [Required]
        public string OwnerId { get; set; } = null!;
        [Required]

        public string BlockedProfileId { get; set; } = null!;

        public SelectProfileDTO BlockedProfile { get; set; } = null!;

    }
}