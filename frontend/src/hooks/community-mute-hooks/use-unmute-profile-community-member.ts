import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMutesService } from "@/services/community-mutes-service";
import { communityMuteQueryKeys } from "./use-community-mute-query-keys";
import { communityMembersQueryKeys } from "../community-members-hooks/use-community-members-query-keys";

export const useUnmuteProfileCommunityMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, profileId }: { communityId: string; profileId: string }) =>
            communityMutesService.unmuteProfile(communityId, profileId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMuteQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                toast.success("User has been unmuted.");
            }
        },
    });
};
