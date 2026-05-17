using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class AdminAuditLog : IBaseKey<string>
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [MaxLength(450)]
        public string? ActorId { get; set; }

        [MaxLength(450)]
        public string? ActorUserId { get; set; }

        [MaxLength(200)]
        public string? ActorDisplayName { get; set; }

        [MaxLength(100)]
        public string? ActorRole { get; set; }

        public AuditTargetType TargetType { get; set; }

        [MaxLength(450)]
        public string TargetId { get; set; } = null!;

        [MaxLength(500)]
        public string? TargetDisplayName { get; set; }

        public AuditActionType ActionType { get; set; }

        [MaxLength(4000)]
        public string? OldState { get; set; }

        [MaxLength(4000)]
        public string? NewState { get; set; }

        [MaxLength(1000)]
        public string? PublicReason { get; set; }

        [MaxLength(500)]
        public string? InternalNote { get; set; }

        [MaxLength(4000)]
        public string? MetadataJson { get; set; }

        [MaxLength(64)]
        public string? IpAddress { get; set; }

        [MaxLength(512)]
        public string? UserAgent { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}
