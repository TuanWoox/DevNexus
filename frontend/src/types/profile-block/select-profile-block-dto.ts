import { SelectProfileDTO } from "../profile/select-profile-dto";

export interface SelectProfileBlockDTO {
    Id: string;
    OwnerId: string;
    BlockedProfileId: string;
    DateCreated?: string;
    BlockedProfile?: SelectProfileDTO | null;
    id?: string;
    ownerId?: string;
    blockedProfileId?: string;
    dateCreated?: string;
    blockedProfile?: SelectProfileDTO | null;
}