import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectCommunityMembershipRequestDTO {
    id: string;
    communityId: string;
    requesterId: string;
    requester?: SelectProfileDTO;
    dateCreated?: string;
    hasBlockedRelation?: boolean;
    isProfileRestricted?: boolean;
    restrictedMessage?: string | null;
    canApprove?: boolean;
    canReject?: boolean;
}
