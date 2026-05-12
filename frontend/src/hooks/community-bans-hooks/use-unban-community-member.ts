import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityBansService } from "@/services/community-bans-service";
import { communityBansQueryKeys } from "./use-community-bans-query-keys";

export const useUnbanCommunityMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (banId: string) => communityBansService.unbanMember(banId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityBansQueryKeys.lists() });
                toast.success("User has been unbanned.");
            }
        }
    });
};
