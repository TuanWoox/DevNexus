using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow
{
    public class SelectUserFollow : BaseEntityHardDelete<string>
    {
        [Required]
        [StringLength(256)]
        public string OwnerId { get; set; } = null!;

        [Required]
        [StringLength(256)]
        public string FollowingProfileId { get; set; } = null!;

        public SelectProfileDTO FollowingProfile { get; set; } = null!;
    }
}