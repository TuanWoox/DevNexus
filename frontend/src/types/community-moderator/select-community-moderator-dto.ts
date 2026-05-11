import { ModeratorProfileDTO } from "./moderator-profile-dto";

export interface SelectCommunityModeratorDTO {
    id: string;
    moderatorId: string;
    communityId: string;
    moderatorProfile?: ModeratorProfileDTO;
    dateCreated?: string;
    dateModified?: string;
}
