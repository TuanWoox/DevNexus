using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember
{
    public class SelectCommunityMemberDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public string ProfileId { get; set; } = null!;
        public SelectProfileDTO? Profile { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public bool IsOwner { get; set; } = false;
        public bool HasBlockedRelation { get; set; }
        public bool IsProfileRestricted { get; set; }
        public string? RestrictedMessage { get; set; }
        public bool CanRemove { get; set; } = true;
        public bool CanBan { get; set; } = true;
        public bool CanPromote { get; set; } = true;
    }
}
