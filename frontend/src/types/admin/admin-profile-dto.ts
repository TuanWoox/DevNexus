export interface AdminProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  role?: string;
  isSuspended: boolean;
  suspendedUntil?: string;
  createdAt?: string;
  postCount: number;
}

export interface AdminSuspendUserDTO {
  daySuspend?: number | null;
}

export interface AdminUpdateRoleDTO {
  newRole: string;
}
