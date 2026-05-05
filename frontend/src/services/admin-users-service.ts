import api from "@/lib/axiosConfig";
import { AdminProfileDTO, AdminSuspendUserDTO, AdminUpdateRoleDTO } from "@/types/admin/admin-profile-dto";
import { PagedData } from "@/types/common/paged-data";
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

function unwrapBooleanResult(data: ReturnResult<boolean>): boolean {
  if (data.message) {
    throw new Error(data.message);
  }

  if (typeof data.result !== 'boolean') {
    throw new Error('Admin user action returned an invalid response');
  }

  return data.result;
}

export const adminUsersService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminProfileDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminProfileDTO, string>>>('/adminusers/paging', payload);
    return data.result;
  },

  suspend: async (id: string, dto: AdminSuspendUserDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminusers/${id}/suspend`, dto);
    return unwrapBooleanResult(data);
  },

  unsuspend: async (id: string): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminusers/${id}/unsuspend`);
    return unwrapBooleanResult(data);
  },

  timeout7Days: async (id: string): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminusers/${id}/timeout/7-days`);
    return unwrapBooleanResult(data);
  },

  timeout30Days: async (id: string): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminusers/${id}/timeout/30-days`);
    return unwrapBooleanResult(data);
  },

  ban: async (id: string): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>(`/adminusers/${id}/ban`);
    return unwrapBooleanResult(data);
  },

  updateRole: async (id: string, dto: AdminUpdateRoleDTO): Promise<boolean> => {
    const { data } = await api.put<ReturnResult<boolean>>(`/adminusers/${id}/role`, dto);
    return unwrapBooleanResult(data);
  },
};
