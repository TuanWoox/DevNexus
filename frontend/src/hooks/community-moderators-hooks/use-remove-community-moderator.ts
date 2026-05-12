import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityModeratorsService } from "@/services/community-moderators-service";
import { communityModeratorsQueryKeys } from "./use-community-moderators-query-keys";

export const useRemoveCommunityModerator = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => communityModeratorsService.removeModerator(id),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityModeratorsQueryKeys.lists() });
                toast.success("Moderator removed successfully.");
            }
        }
    });
};
