export interface AdminProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  reputationPoints: number;
  role?: string | null;
  isSuspended: boolean;
  suspendedUntil?: string | null;
  createdAt?: string | null;
  postCount: number;
}

export interface AdminSuspendUserDTO {
  daySuspend?: number | null;
  reason?: string | null;
}

export interface AdminUpdateRoleDTO {
  newRole: string;
}
