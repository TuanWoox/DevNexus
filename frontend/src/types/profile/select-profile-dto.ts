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
}