using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember
{
    public class SelectCommunityMembershipRequestDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public string RequesterId { get; set; } = null!;
        public SelectProfileDTO? Requester { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
