import { reportService } from "@/services/report-service";
import { CreateReportDTO } from "@/types/report/create-report-dto";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateReport = () => {
  return useMutation({
    mutationFn: (payload: CreateReportDTO) => reportService.create(payload),
    onSuccess: () => {
      toast.success("Report submitted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not submit report");
    },
  });
};
