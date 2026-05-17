using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Admin
{
    public class AdminAuditLogDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string? ActorId { get; set; }
        public string? ActorUserId { get; set; }
        public string? ActorDisplayName { get; set; }
        public string? ActorRole { get; set; }
        public AuditTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public string? TargetDisplayName { get; set; }
        public AuditActionType ActionType { get; set; }
        public string? OldState { get; set; }
        public string? NewState { get; set; }
        public string? PublicReason { get; set; }
        public string? InternalNote { get; set; }
        public string? MetadataJson { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
