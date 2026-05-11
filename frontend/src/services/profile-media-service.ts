import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectProfileMediaDTO } from "@/types/profile-media/select-profile-media-dto";
import { CreateProfileMediaDTO } from "@/types/profile-media/create-profile-media-dto";
import { UpdatePrimaryProfileMediaDTO } from "@/types/profile-media/update-primary-profile-media-dto";
import { DisplayProfileMediaDTO } from "@/types/profile-media/display-profile-media-dto";
import { ProfileMediaType } from "@/types/profile-media/profile-media-type";

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

    getProfileMediasWithPagination: async (profileId: string, profileMediaType: ProfileMediaType, payload: Page<string>): Promise<PagedData<DisplayProfileMediaDTO, string>> => {
        const response = await api.post<ReturnResult<PagedData<DisplayProfileMediaDTO, string>>>(`/ProfileMedia/paging/${profileId}?profileMediaType=${profileMediaType}`, payload);
        return response.data.result ?? { data: [], page: payload };
    },

    updatePrimaryProfileMedia: async (payload: UpdatePrimaryProfileMediaDTO): Promise<SelectProfileMediaDTO> => {
        const response = await api.patch<ReturnResult<SelectProfileMediaDTO>>('/ProfileMedia/primary', payload);
        return response.data.result;
    }
};
