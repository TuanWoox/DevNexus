namespace platform_core_service.Common.Utils.Enums
{
    public enum AuditActionType
    {
        UserSuspended = 0,
        UserUnsuspended = 1,
        UserPermanentlyBanned = 2,
        UserRoleChanged = 3,

        PostForceApproved = 10,
        PostForceRejected = 11,

        ModerationQueueApproved = 20,
        ModerationQueueRejected = 21,

        ReportAssigned = 30,
        ReportResolved = 31,
        ReportDismissed = 32,
        ReportEscalated = 33
    }
}
