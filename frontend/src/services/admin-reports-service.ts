import api from "@/lib/axiosConfig";
import { AdminReportDetailDTO } from "@/types/admin/admin-report-detail-dto";
import { AdminReportDTO } from "@/types/admin/admin-report-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

export const adminReportsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminReportDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminReportDTO, string>>>("/AdminReports/paging", payload);
    return data.result ?? { data: [], page: payload };
  },

  getById: async (id: string): Promise<AdminReportDetailDTO> => {
    const { data } = await api.get<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}`);
    return data.result;
  },
};
