using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO
{
    public class ProfileSyncDTO : IBaseKey<string>
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BackgroundUrl { get; set; }
        public string? Bio { get; set; }
        public int ReputationPoints { get; set; }
        public List<string> TechStacks { get; set; } = new();
        public bool IsPrivate { get; set; }
        public string ApplicationUserId { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public bool Deleted { get; set; }
        public DateTimeOffset? DateDeleted { get; set; }
    }

    public class ProfileBlockSyncDTO : IBaseKey<string>
    {
        public string Id { get; set; }
        public string OwnerId { get; set; }
        public string BlockedProfileId { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }

    public class UserFollowSyncDTO : IBaseKey<string>
    {
        public string Id { get; set; }
        public string OwnerId { get; set; }
        public string FollowingProfileId { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
