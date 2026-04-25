export interface SelectCommunityDTO {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    communityCoverPhotoUrl?: string;
    slug: string;
    isPrivate: boolean;
    dateCreated?: string;
    dateModified?: string;
}