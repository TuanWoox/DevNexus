export interface UpdateProfileDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
    bio: string;
    techStacks: string[];
    isPrivate?: boolean;
}