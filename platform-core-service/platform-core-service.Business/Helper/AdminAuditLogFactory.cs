using System.Text.Json;
using System.Text.Json.Serialization;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Business.Helper
{
    public static class AdminAuditLogFactory
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public static string? SerializeState(object? value)
        {
            return value == null ? null : JsonSerializer.Serialize(value, JsonOptions);
        }

        public static CreateAdminAuditLogDTO ForUserAction(
            AuditActionType actionType,
            string targetId,
            string? targetDisplayName,
            object? oldState,
            object? newState,
            object? metadata = null,
            string? publicReason = null,
            string? internalNote = null)
        {
            return Create(
                AuditTargetType.User,
                actionType,
                targetId,
                targetDisplayName,
                oldState,
                newState,
                metadata,
                publicReason,
                internalNote);
        }

        public static CreateAdminAuditLogDTO ForPostAction(
            AuditActionType actionType,
            string targetId,
            string? targetDisplayName,
            object? oldState,
            object? newState,
            object? metadata = null,
            string? publicReason = null,
            string? internalNote = null)
        {
            return Create(
                AuditTargetType.Post,
                actionType,
                targetId,
                targetDisplayName,
                oldState,
                newState,
                metadata,
                publicReason,
                internalNote);
        }

        public static CreateAdminAuditLogDTO ForQueueAction(
            AuditActionType actionType,
            string targetId,
            string? targetDisplayName,
            object? oldState,
            object? newState,
            object? metadata = null,
            string? publicReason = null,
            string? internalNote = null)
        {
            return Create(
                AuditTargetType.ModerationQueueEntry,
                actionType,
                targetId,
                targetDisplayName,
                oldState,
                newState,
                metadata,
                publicReason,
                internalNote);
        }

        private static CreateAdminAuditLogDTO Create(
            AuditTargetType targetType,
            AuditActionType actionType,
            string targetId,
            string? targetDisplayName,
            object? oldState,
            object? newState,
            object? metadata,
            string? publicReason,
            string? internalNote)
        {
            return new CreateAdminAuditLogDTO
            {
                TargetType = targetType,
                TargetId = targetId,
                TargetDisplayName = targetDisplayName,
                ActionType = actionType,
                OldState = SerializeState(oldState),
                NewState = SerializeState(newState),
                MetadataJson = SerializeState(metadata),
                PublicReason = publicReason,
                InternalNote = internalNote
            };
        }
    }
}
