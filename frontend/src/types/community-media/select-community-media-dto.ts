export interface SelectCommunityMediaDTO {
    id: string;
    communityId: string;
    isPrimary: boolean;
    dateCreated: string;
    dateModified?: string;
    deleted?: boolean
}
