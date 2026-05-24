using System;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute
{
    public class SelectCommunityMuteDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public string MutedProfileId { get; set; } = null!;
        public SelectProfileDTO? MutedProfile { get; set; }
        public string MutedById { get; set; } = null!;
        public SelectProfileDTO? MutedBy { get; set; }
        public string? MuteReason { get; set; }
        public DateTimeOffset? MutedUntil { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        
        // Privacy / relation fields (similar to Ban list)
        public bool HasBlockedRelation { get; set; }
        public bool IsMutedProfileRestricted { get; set; }
        public bool IsMutedByRestricted { get; set; }
        public string? RestrictedMessage { get; set; }
        public bool CanUnmute { get; set; } = true;
    }
}
