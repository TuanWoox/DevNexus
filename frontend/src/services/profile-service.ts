import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { UpdateProfileDTO } from "@/types/profile/update-profile-dto";

export const profileService = {
    getProfileById: async (profileId: string): Promise<SelectProfileDTO> => {
        const { data } = await api.get<ReturnResult<SelectProfileDTO>>(`/Profiles/${profileId}`);
        return data.result;
    },

    updateProfile: async (updateProfileDTO: UpdateProfileDTO): Promise<SelectProfileDTO> => {
        const { data } = await api.put<ReturnResult<SelectProfileDTO>>('/Profiles', updateProfileDTO);
        return data.result;
    }
}