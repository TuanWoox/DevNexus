import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminReportsService } from "@/services/admin-reports-service";
import { Page } from "@/types/common/page";
import { adminQueryKeys } from "./admin-query-keys";

export const useGetAdminReports = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.reports.paging(page),
    queryFn: () => adminReportsService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
