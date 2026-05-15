import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { toast } from "sonner";

export function useCancelRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (requestId: string) => followRequestService.cancelRequest(requestId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.sent() });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                toast.success("Follow request cancelled");
            }
        }
    });
}
