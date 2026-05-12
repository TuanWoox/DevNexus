import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { toast } from "sonner";

export function useBulkApproveRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followRequestService.bulkApprove,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      toast.success(`${count} request(s) accepted`);
    },
    onError: () => {
      toast.error("Failed to accept requests");
    },
  });
}
