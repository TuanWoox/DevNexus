import { SelectProfileDTO } from "@/types/profile/select-profile-dto";

export interface SelectFollowRequestDTO {
  id: string;
  requesterProfileId: string;
  targetProfileId: string;
  requesterProfile: SelectProfileDTO;
  dateCreated: string;
}
