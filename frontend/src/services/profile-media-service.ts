import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectProfileMediaDTO } from "@/types/profile-media/select-profile-media-dto";
import { CreateProfileMediaDTO } from "@/types/profile-media/create-profile-media-dto";
import { UpdatePrimaryProfileMediaDTO } from "@/types/profile-media/update-primary-profile-media-dto";

export const profileMediaService = {
    createProfileMedia: async (data: CreateProfileMediaDTO): Promise<SelectProfileMediaDTO> => {
        const formData = new FormData();
        formData.append("File", data.file);
        // Important: ProfileMediaType in DTO should match the server's expected exact casing
        formData.append("ProfileMediaType", data.profileMediaType.toString());

        const response = await api.post<ReturnResult<SelectProfileMediaDTO>>('/ProfileMedia', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.result;
    },

    getProfileMediasWithPagination: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectProfileMediaDTO, string>> => {
        const response = await api.post<ReturnResult<PagedData<SelectProfileMediaDTO, string>>>(`/ProfileMedia/paging/${profileId}`, payload);
        return response.data.result;
    },

    updatePrimaryProfileMedia: async (payload: UpdatePrimaryProfileMediaDTO): Promise<SelectProfileMediaDTO> => {
        const response = await api.patch<ReturnResult<SelectProfileMediaDTO>>('/ProfileMedia/primary', payload);
        return response.data.result;
    }
};
