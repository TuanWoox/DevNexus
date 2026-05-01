import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectCommunityBanDTO {
    id: string;
    communityId: string;
    bannedProfileId: string;
    bannedProfile?: SelectProfileDTO;
    bannedById: string;
    bannedBy?: SelectProfileDTO;
    banReason?: string;
    dateCreated?: string;
}
