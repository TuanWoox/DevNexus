using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest
{
    public class SelectFollowRequest : BaseEntityHardDelete<string>
    {
        [Required]
        public string RequesterProfileId { get; set; } = null!;

        [Required]
        public string TargetProfileId { get; set; } = null!;

        public SelectProfileDTO TargetProfile { get; set; } = null!;
    }
}