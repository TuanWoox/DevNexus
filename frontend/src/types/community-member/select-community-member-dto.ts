import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectCommunityMemberDTO {
    id: string;
    communityId: string;
    profileId: string;
    profile?: SelectProfileDTO;
    dateCreated?: string;
    isOwner?: boolean;
    hasBlockedRelation?: boolean;
    isProfileRestricted?: boolean;
    restrictedMessage?: string | null;
    canRemove?: boolean;
    canBan?: boolean;
    canPromote?: boolean;
}
