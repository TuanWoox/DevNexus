import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { toast } from "sonner";

export function useBulkRejectRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followRequestService.bulkReject,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      toast.success(`${count} request(s) rejected`);
    },
    onError: () => {
      toast.error("Failed to reject requests");
    },
  });
}
