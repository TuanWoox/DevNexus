export enum AuditTargetType {
  User = 0,
  Post = 1,
  ModerationQueueEntry = 2,
  ModerationReport = 3,
}

export enum AuditActionType {
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
  ReportEscalated = 33,
  ReportTargetActionExecuted = 34,
}

export interface AdminAuditLogDTO {
  id: string
  actorId?: string | null
  actorUserId?: string | null
  actorDisplayName?: string | null
  actorRole?: string | null
  targetType: AuditTargetType | number
  targetId: string
  targetDisplayName?: string | null
  actionType: AuditActionType | number
  oldState?: string | null
  newState?: string | null
  publicReason?: string | null
  internalNote?: string | null
  metadataJson?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}
