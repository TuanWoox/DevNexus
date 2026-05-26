export type ModerationStatus = "Pending" | "Approved" | "Flagged" | "InReview" | 0 | 1 | 2 | 3;

export function normalizeModerationStatus(status: ModerationStatus | undefined): Exclude<ModerationStatus, number> {
    if (status === 0) return "Pending";
    if (status === 1) return "Approved";
    if (status === 2) return "Flagged";
    if (status === 3) return "InReview";
    return status ?? "Approved";
}

export function isPubliclyVisibleModerationStatus(status: ModerationStatus | undefined): boolean {
    const normalized = normalizeModerationStatus(status);
    return normalized === "Approved" || normalized === "Pending";
}

export function isHiddenByModeration(status: ModerationStatus | undefined): boolean {
    const normalized = normalizeModerationStatus(status);
    return normalized === "InReview" || normalized === "Flagged";
}

export function canInteractWithModeratedContent(status: ModerationStatus | undefined): boolean {
    const normalized = normalizeModerationStatus(status);
    return normalized === "Approved" || normalized === "Pending";
}
