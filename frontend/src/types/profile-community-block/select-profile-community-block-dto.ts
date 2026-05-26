import { SelectCommunityDTO } from "@/types/community/select-community-dto";

export interface SelectProfileCommunityBlockDTO {
    id: string;
    profileId: string;
    communityId: string;
    dateCreated?: string;
    community: SelectCommunityDTO;
}
