export interface UpdateCommunityDTO {
    id: string;
    name?: string;
    description?: string;
    communityCoverPhotoUrl?: string;
    slug?: string;
    isPrivate?: boolean;
}