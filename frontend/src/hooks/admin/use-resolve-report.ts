import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminReportsService } from "@/services/admin-reports-service";
import { ResolveReportDTO } from "@/types/admin/admin-report-actions-dto";
import { adminQueryKeys } from "./admin-query-keys";

export const useResolveReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolveReportDTO }) =>
      adminReportsService.resolve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all });
      toast.success("Report resolved");
    },
    onError: () => toast.error("Failed to resolve report"),
  });
};
