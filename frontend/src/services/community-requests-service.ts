import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityMemberDTO } from "@/types/community-member/select-community-member-dto";
import { SelectCommunityMembershipRequestDTO } from "@/types/community-requests/select-community-membership-request-dto";

export const communityRequestsService = {
    cancelRequest: async (communityId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/community-members/${communityId}/requests/cancel`);
        return data.result;
    },

    approveRequest: async (requestId: string): Promise<SelectCommunityMemberDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityMemberDTO>>(`/community-members/requests/${requestId}/approve`);
        return data.result;
    },

    rejectRequest: async (requestId: string): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(`/community-members/requests/${requestId}/reject`);
        return data.result;
    },

    getRequestsWithPagination: async (communityId: string, payload: Page<string>): Promise<PagedData<SelectCommunityMembershipRequestDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>>(`/community-members/${communityId}/requests/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    bulkApproveRequests: async (communityId: string, payload: Page<string>): Promise<number> => {
        // According to backend signature: [HttpPost("{communityId}/requests/bulk-approve")] public async Task<IActionResult> BulkApproveRequests(string communityId, Page<string> page)
        const { data } = await api.post<ReturnResult<number>>(`/community-members/${communityId}/requests/bulk-approve`, payload);
        return data.result;
    },

    bulkRejectRequests: async (communityId: string, payload: Page<string>): Promise<number> => {
        const { data } = await api.post<ReturnResult<number>>(`/community-members/${communityId}/requests/bulk-reject`, payload);
        return data.result;
    }
}
