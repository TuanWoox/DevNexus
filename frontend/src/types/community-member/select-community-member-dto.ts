import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectCommunityMemberDTO {
    id: string;
    communityId: string;
    profileId: string;
    profile?: SelectProfileDTO;
    dateCreated?: string;
    isOwner?: boolean;
}
