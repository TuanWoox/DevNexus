import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectUserFollowDTO {
    ownerId: string,
    owner?: SelectProfileDTO,
    followingProfileId: string,
    followingProfile?: SelectProfileDTO,
    id: string,
    dateCreated: string,
    dateModified: string
}