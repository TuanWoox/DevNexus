export interface CreateCommunityDTO {
    name: string;
    description?: string;
    communityCoverPhotoUrl?: string;
    slug?: string;
    isPrivate: boolean;
    requireContentApproval?: boolean;
}
