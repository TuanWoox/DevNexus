import api from "@/lib/axiosConfig";
import { SelectTagDTO, CreateTagDTO, UpdateTagDTO, MergeTagsDTO } from "@/types/admin/admin-tag-dto";
import { PagedData } from "@/types/common/paged-data";
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export const adminTagsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<SelectTagDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SelectTagDTO, string>>>('/admintags/paging', payload);
    return data.result;
  },

  create: async (dto: CreateTagDTO): Promise<SelectTagDTO> => {
    const { data } = await api.post<ReturnResult<SelectTagDTO>>('/admintags/create', dto);
    return data.result;
  },

  update: async (dto: UpdateTagDTO): Promise<boolean> => {
    const { data } = await api.put<ReturnResult<boolean>>('/admintags/update', dto);
    return data.result;
  },

  delete: async (id: string): Promise<boolean> => {
    const { data } = await api.delete<ReturnResult<boolean>>(`/admintags/${id}`);
    return data.result;
  },

  merge: async (dto: MergeTagsDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>('/admintags/merge', dto);
    return data.result;
  },
};
