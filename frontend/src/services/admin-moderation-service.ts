import api from "@/lib/axiosConfig";
import { AdminQueueEntryDTO, AdminQueueResolveDTO } from "@/types/admin/admin-queue-entry-dto";
import { PagedData } from "@/types/common/paged-data";
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export const adminModerationService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminQueueEntryDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminQueueEntryDTO, string>>>('/adminmoderation/paging', payload);
    return data.result;
  },

  approve: async (dto: AdminQueueResolveDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>('/adminmoderation/approve', dto);
    return data.result;
  },

  reject: async (dto: AdminQueueResolveDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>('/adminmoderation/reject', dto);
    return data.result;
  },
};
