import api from "@/lib/axiosConfig";
import { AdminDashboardDTO } from "@/types/admin/admin-dashboard-dto";
import { ReturnResult } from "@/types/common/return-result";

export const adminDashboardService = {
  getDashboard: async (): Promise<AdminDashboardDTO> => {
    const { data } = await api.get<ReturnResult<AdminDashboardDTO>>('/admindashboard');
    return data.result;
  },
};
