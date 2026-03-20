using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember
{
    public class SelectCommunityBanDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public string BannedProfileId { get; set; } = null!;
        public SelectProfileDTO? BannedProfile { get; set; }
        public string BannedById { get; set; } = null!;
        public SelectProfileDTO? BannedBy { get; set; }
        public string? BanReason { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
