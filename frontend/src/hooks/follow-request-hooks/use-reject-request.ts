import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { toast } from "sonner";

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followRequestService.rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      toast.success("Follow request rejected");
    },
    onError: () => {
      toast.error("Failed to reject request");
    },
  });
}
