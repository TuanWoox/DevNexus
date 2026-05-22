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
        public bool HasBlockedRelation { get; set; }
        public bool IsProfileRestricted { get; set; }
        public string? RestrictedMessage { get; set; }
        public bool CanApprove { get; set; } = true;
        public bool CanReject { get; set; } = true;
    }
}
