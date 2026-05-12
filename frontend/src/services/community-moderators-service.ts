import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityModeratorDTO } from "@/types/community-moderator/select-community-moderator-dto";
import { CreateCommunityModeratorDTO } from "@/types/community-moderator/create-community-moderator-dto";

export const communityModeratorsService = {
    addModerator: async (payload: CreateCommunityModeratorDTO): Promise<SelectCommunityModeratorDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityModeratorDTO>>(`/CommunityModerators`, payload);
        return data.result as SelectCommunityModeratorDTO;
    },

    removeModerator: async (id: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/CommunityModerators/${id}`);
        return data.result;
    },

    getModeratorsWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityModeratorDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityModeratorDTO, string>>>(`/CommunityModerators/${communityId}/paging`, payload);
        return data.result ?? { data: [], page: payload };
    }
}
