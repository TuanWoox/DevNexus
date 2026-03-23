using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class FollowRequest : BaseEntityHardDelete<string>
    {
        [Required]
        [ForeignKey(nameof(RequesterProfile))]
        public string RequesterProfileId { get; set; } = null!;
        [InverseProperty(nameof(Profile.SentFollowRequests))]
        public Profile RequesterProfile { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(TargetProfile))]
        public string TargetProfileId { get; set; } = null!;
        [InverseProperty(nameof(Profile.ReceivedFollowRequests))]
        public Profile TargetProfile { get; set; } = null!;
    }
}