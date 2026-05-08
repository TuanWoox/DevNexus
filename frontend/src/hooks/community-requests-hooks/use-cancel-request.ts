import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";
import { communityMembersQueryKeys } from "../community-members-hooks/use-community-members-query-keys";
import { communityQueryKeys } from "../community-hooks/use-community-query-key";

export const useCancelRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => communityRequestsService.cancelRequest(communityId),
        onSuccess: (data, communityId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.myRole(communityId) });
                toast.success("Join request cancelled.");
            }
        }
    });
};
