import { ProfileMediaType } from "./profile-media-type";

export interface SelectProfileMediaDTO {
    id: string;
    profileId: string;
    isPrimary: boolean;
    profileMediaType: ProfileMediaType;
    dateCreated: string;
    dateModified?: string;
    deleted?: boolean
}
