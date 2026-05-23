export interface SelectCommunityDTO {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    communityCoverPhotoUrl?: string;
    slug: string;
    isPrivate: boolean;
    requireContentApproval: boolean;
    dateCreated?: string;
    dateModified?: string;
    currentUserRole: string;
}
