import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityMuteDTO } from "@/types/community-mutes/select-community-mute-dto";
import { CreateCommunityMuteDTO } from "@/types/community-mutes/create-community-mute-dto";

export const communityMutesService = {
    muteMember: async (payload: CreateCommunityMuteDTO): Promise<SelectCommunityMuteDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityMuteDTO>>(`/community-mute/mutes`, payload);
        return data.result as SelectCommunityMuteDTO;
    },

    unmuteMember: async (muteId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/community-mute/mutes/${muteId}`);
        return data.result;
    },

    unmuteProfile: async (communityId: string, profileId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(
            `/community-mute/${communityId}/profiles/${profileId}`
        );
        return data.result;
    },

    getMutesWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityMuteDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityMuteDTO, string>>>(`/community-mute/${communityId}/mutes/paging`, payload);
        return data.result ?? { data: [], page: payload };
    }
}
