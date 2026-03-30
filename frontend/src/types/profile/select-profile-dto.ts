export interface SelectProfileDTO {
    id: string;
    applicationUserId: string;
    fullName: string;
    avatarUrl: string;
    bio: string;
    reputationPoints: number;
    techStacks: string[];
}