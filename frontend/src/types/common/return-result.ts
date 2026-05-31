export interface AccountModerationStatus {
    isSuspended: boolean;
    isPermanentBan?: boolean | null;
    suspendedUntil?: string | null;
    reason?: string | null;
}

export interface ReturnResult<T> {
    message: string;
    result: T;
    moderationStatus?: AccountModerationStatus | null;
}
