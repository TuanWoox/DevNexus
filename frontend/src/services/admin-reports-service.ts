import api from "@/lib/axiosConfig";
import { AdminReportDetailDTO } from "@/types/admin/admin-report-detail-dto";
import { AdminReportDTO } from "@/types/admin/admin-report-dto";
import {
  AssignReportDTO,
  DismissReportDTO,
  EscalateReportDTO,
  ResolveReportDTO,
} from "@/types/admin/admin-report-actions-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

function requireActionResult<T>(data: ReturnResult<T>, fallbackMessage: string): T {
  if (data.result == null) {
    throw new Error(data.message || fallbackMessage);
  }

  return data.result;
}

export const adminReportsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminReportDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminReportDTO, string>>>("/AdminReports/paging", payload);
    return data.result ?? { data: [], page: payload };
  },

  getById: async (id: string): Promise<AdminReportDetailDTO> => {
    const { data } = await api.get<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}`);
    return data.result;
  },

  assignToMe: async (id: string, payload: AssignReportDTO = {}): Promise<AdminReportDetailDTO> => {
    const { data } = await api.post<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}/assign-to-me`, payload);
    return requireActionResult(data, "Failed to assign report");
  },

  resolve: async (id: string, payload: ResolveReportDTO): Promise<AdminReportDetailDTO> => {
    const { data } = await api.post<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}/resolve`, payload);
    return requireActionResult(data, "Failed to resolve report");
  },

  dismiss: async (id: string, payload: DismissReportDTO): Promise<AdminReportDetailDTO> => {
    const { data } = await api.post<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}/dismiss`, payload);
    return requireActionResult(data, "Failed to dismiss report");
  },

  escalate: async (id: string, payload: EscalateReportDTO): Promise<AdminReportDetailDTO> => {
    const { data } = await api.post<ReturnResult<AdminReportDetailDTO>>(`/AdminReports/${id}/escalate`, payload);
    return requireActionResult(data, "Failed to escalate report");
  },
};
