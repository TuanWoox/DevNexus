using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Attributes;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow
{
    public class CreateUserFollow
    {
        [TrimmedRequired]
        [StringLength(256)]
        public string FollowingProfileId { get; set; } = null!;
    }
}