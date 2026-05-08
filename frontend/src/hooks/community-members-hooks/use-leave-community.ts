import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMembersService } from "@/services/community-members-service";
import { communityMembersQueryKeys } from "./use-community-members-query-keys";
import { communityQueryKeys } from "../community-hooks/use-community-query-key";

export const useLeaveCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => communityMembersService.leaveCommunity(communityId),
        onSuccess: (data, communityId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(communityId) });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() })
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.myRole(communityId) });
                toast.success("Successfully left the community.");
            }
        }
    });
};
