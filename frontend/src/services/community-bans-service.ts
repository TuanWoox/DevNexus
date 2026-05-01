import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityBanDTO } from "@/types/community-bans/select-community-ban-dto";
import { CreateCommunityBanDTO } from "@/types/community-bans/create-community-ban-dto";

export const communityBansService = {
    banMember: async (payload: CreateCommunityBanDTO): Promise<SelectCommunityBanDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityBanDTO>>(`/community-members/bans`, payload);
        return data.result as SelectCommunityBanDTO;
    },

    unbanMember: async (banId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/community-members/bans/${banId}`);
        return data.result;
    },

    getBansWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityBanDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityBanDTO, string>>>(`/community-members/${communityId}/bans/paging`, payload);
        return data.result ?? { data: [], page: payload };
    }
}
