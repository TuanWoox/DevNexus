import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityBansService } from "@/services/community-bans-service";
import { communityBansQueryKeys } from "./use-community-bans-query-keys";

export const useUnbanProfileCommunityMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, profileId }: { communityId: string; profileId: string }) =>
            communityBansService.unbanProfile(communityId, profileId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityBansQueryKeys.all });
                toast.success("User has been unbanned.");
            }
        },
    });
};
