import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectFollowRequestDTO } from "@/types/follow-request/select-follow-request-dto";
import { SelectUserFollowDTO } from "@/types/user-follow/select-user-follow-dto";

export const followRequestService = {
  getReceivedRequests: async (payload: Page<string>): Promise<PagedData<SelectFollowRequestDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SelectFollowRequestDTO, string>>>(
      '/FollowRequests/received/paging',
      payload
    );
    return data.result ?? { data: [], page: payload };
  },

  getSentRequests: async (payload: Page<string>): Promise<PagedData<SelectFollowRequestDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SelectFollowRequestDTO, string>>>(
      '/FollowRequests/sent/paging',
      payload
    );
    return data.result ?? { data: [], page: payload };
  },

  approveRequest: async (requestId: string): Promise<SelectUserFollowDTO> => {
    const { data } = await api.put<ReturnResult<SelectUserFollowDTO>>(
      `/FollowRequests/${requestId}/approve`
    );
    return data.result;
  },

  rejectRequest: async (requestId: string): Promise<boolean> => {
    const { data } = await api.delete<ReturnResult<boolean>>(
      `/FollowRequests/${requestId}/reject`
    );
    return data.result;
  },

  cancelRequest: async (requestId: string): Promise<boolean> => {
    const { data } = await api.delete<ReturnResult<boolean>>(
      `/FollowRequests/${requestId}/cancel`
    );
    return data.result;
  },

  bulkApprove: async (requestIds: string[]): Promise<number> => {
    const { data } = await api.put<ReturnResult<number>>(
      '/FollowRequests/bulk/approve',
      { selected: requestIds }
    );
    return data.result;
  },

  bulkReject: async (requestIds: string[]): Promise<number> => {
    const { data } = await api.delete<ReturnResult<number>>(
      '/FollowRequests/bulk/reject',
      { data: { selected: requestIds } }
    );
    return data.result;
  },

  bulkCancel: async (requestIds: string[]): Promise<number> => {
    const { data } = await api.delete<ReturnResult<number>>(
      '/FollowRequests/bulk/cancel',
      { data: { selected: requestIds } }
    );
    return data.result;
  },
};
