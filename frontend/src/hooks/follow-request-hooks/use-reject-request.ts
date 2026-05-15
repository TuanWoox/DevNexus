import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { toast } from "sonner";

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => followRequestService.rejectRequest(requestId),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.received() });
        toast.success("Follow request rejected");
      }
    }
  });
}
