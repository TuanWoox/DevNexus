using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator
{
    public class SelectCommunityModeratorDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string ModeratorId { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public ModeratorProfileDTO? ModeratorProfile { get; set; }
        public bool HasBlockedRelation { get; set; }
        public bool IsProfileRestricted { get; set; }
        public string? RestrictedMessage { get; set; }
        public bool CanDemote { get; set; } = true;
    }
}
