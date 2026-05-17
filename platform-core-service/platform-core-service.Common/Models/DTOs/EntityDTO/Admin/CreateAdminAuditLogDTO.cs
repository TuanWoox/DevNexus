using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Admin
{
    public class CreateAdminAuditLogDTO
    {
        public AuditTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public string? TargetDisplayName { get; set; }
        public AuditActionType ActionType { get; set; }
        public string? OldState { get; set; }
        public string? NewState { get; set; }
        public string? PublicReason { get; set; }
        public string? InternalNote { get; set; }
        public string? MetadataJson { get; set; }
    }
}
