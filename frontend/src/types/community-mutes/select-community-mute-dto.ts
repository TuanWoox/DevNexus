import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectCommunityMuteDTO {
    id: string;
    communityId: string;
    mutedProfileId: string;
    mutedProfile?: SelectProfileDTO;
    mutedById: string;
    mutedBy?: SelectProfileDTO;
    muteReason?: string;
    mutedUntil?: string; // ISO DateTime string
    dateCreated?: string; // ISO DateTime string
    
    hasBlockedRelation?: boolean;
    isMutedProfileRestricted?: boolean;
    isMutedByRestricted?: boolean;
    restrictedMessage?: string | null;
    canUnmute?: boolean;
}
