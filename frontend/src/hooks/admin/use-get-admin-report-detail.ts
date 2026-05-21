import { useQuery } from "@tanstack/react-query";
import { adminReportsService } from "@/services/admin-reports-service";
import { adminQueryKeys } from "./admin-query-keys";

export const useGetAdminReportDetail = (id?: string | null, enabled = true) => {
  return useQuery({
    queryKey: id ? adminQueryKeys.reports.detail(id) : adminQueryKeys.reports.detail(""),
    queryFn: () => adminReportsService.getById(id!),
    enabled: enabled && !!id,
  });
};
