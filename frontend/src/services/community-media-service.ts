import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { CreateCommunityMediaDTO } from "@/types/community-media/create-community-media-dto";
import { SelectCommunityMediaDTO } from "@/types/community-media/select-community-media-dto";
import { UpdatePrimaryCommunityMediaDTO } from "@/types/community-media/update-primary-community-media-dto";

export const communityMediaService = {
    createCommunityMedia: async (data: CreateCommunityMediaDTO): Promise<SelectCommunityMediaDTO> => {
        const formData = new FormData();
        formData.append("File", data.file);
        formData.append("CommunityId", data.communityId);

        const response = await api.post<ReturnResult<SelectCommunityMediaDTO>>('/CommunityMedia', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.result;
    },

    getCommunityMediasWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityMediaDTO, string>> => {
        const response = await api.post<ReturnResult<PagedData<SelectCommunityMediaDTO, string>>>(`/CommunityMedia/paging/${communityId}`, payload);
        return response.data.result ?? { data: [], page: payload };
    },

    updatePrimaryCommunityMedia: async (payload: UpdatePrimaryCommunityMediaDTO): Promise<SelectCommunityMediaDTO> => {
        const response = await api.patch<ReturnResult<SelectCommunityMediaDTO>>('/CommunityMedia/primary', payload);
        return response.data.result;
    },

    deleteCommunityMedia: async (id: string): Promise<boolean> => {
        const response = await api.delete<ReturnResult<boolean>>(`/CommunityMedia/${id}`);
        return response.data.result;
    },

    bulkDeleteCommunityMedia: async (ids: string[]): Promise<number> => {
        const response = await api.delete<ReturnResult<number>>('/CommunityMedia/bulk', {
            data: ids
        });
        return response.data.result;
    }
};
