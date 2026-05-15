export interface SelectProfileDTO {
    id: string;
    applicationUserId: string;
    fullName: string;
    avatarUrl: string;
    backgroundUrl: string;
    bio: string;
    dateModified?: string;
    deleted?: boolean;
    isPrivate: boolean;
    reputationPoints: number;
    techStacks: string[];

    // Follow metadata — computed per-request by backend
    followerCount: number;
    followingCount: number;
    canViewProfile: boolean;
    followStatus?: 'none' | 'following' | 'requested' | null;
    currentUserFollowId?: string;
    currentUserRequestId?: string;
}