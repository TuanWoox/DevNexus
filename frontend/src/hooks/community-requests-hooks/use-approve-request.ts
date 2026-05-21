import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";
import { communityMembersQueryKeys } from "@/hooks/community-members-hooks/use-community-members-query-keys";

export const useApproveRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (requestId: string) => communityRequestsService.approveRequest(requestId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                toast.success("Request approved successfully.");
            }
        }
    });
};
