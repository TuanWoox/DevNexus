import api from "@/lib/axiosConfig";
import { AdminPostDTO } from "@/types/admin/admin-post-dto";
import { PagedData } from "@/types/common/paged-data";
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export interface AdminForceRejectPostDTO {
  reasonText: string;
  moderatorNote?: string;
}

export const adminPostsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminPostDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminPostDTO, string>>>('/adminposts/paging', payload);
    return data.result;
  },

  approve: async (id: string): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminposts/${id}/approve`);
    return data.result;
  },

  reject: async (id: string, dto: AdminForceRejectPostDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminposts/${id}/reject`, dto);
    return data.result;
  },
};
