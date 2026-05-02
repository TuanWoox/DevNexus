using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Profile
{
    public class AdminProfileDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string? Role { get; set; }
        public bool IsSuspended { get; set; }
        public DateTimeOffset? SuspendedUntil { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
        public int PostCount { get; set; }
    }
}
