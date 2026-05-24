export enum CommunityApprovalStatus {
    Pending = "Pending",
    Approved = "Approved",
    Rejected = "Rejected"
}

export type CommunityApprovalStatusValue = CommunityApprovalStatus | 0 | 1 | 2;

export function normalizeCommunityApprovalStatus(
    status: CommunityApprovalStatusValue | null | undefined
): CommunityApprovalStatus | null {
    if (status === 0) return CommunityApprovalStatus.Pending;
    if (status === 1) return CommunityApprovalStatus.Approved;
    if (status === 2) return CommunityApprovalStatus.Rejected;
    return status ?? null;
}
