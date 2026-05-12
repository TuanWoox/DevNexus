import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityMemberDTO } from "@/types/community-member/select-community-member-dto";
import { SelectCommunityMembershipRequestDTO } from "@/types/community-requests/select-community-membership-request-dto";

export const communityMembersService = {
    joinCommunity: async (communityId: string): Promise<SelectCommunityMemberDTO | SelectCommunityMembershipRequestDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityMemberDTO | SelectCommunityMembershipRequestDTO>>(`/community-members/${communityId}/join`);
        return data.result;
    },

    leaveCommunity: async (communityId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/community-members/${communityId}/leave`);
        return data.result;
    },

    getCommunityMembersWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityMemberDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>>(`/community-members/${communityId}/members/paging`, payload);
        return data.result ?? { data: [], page: payload };
    }
}
