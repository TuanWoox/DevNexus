import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMutesService } from "@/services/community-mutes-service";
import { communityMuteQueryKeys } from "./use-community-mute-query-keys";
import { communityMembersQueryKeys } from "../community-members-hooks/use-community-members-query-keys";
import { CreateCommunityMuteDTO } from "@/types/community-mutes/create-community-mute-dto";

export const useMuteCommunityMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCommunityMuteDTO) => communityMutesService.muteMember(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMuteQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                toast.success("User has been muted successfully.");
            }
        }
    });
};
