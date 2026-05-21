import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityBansService } from "@/services/community-bans-service";
import { communityBansQueryKeys } from "./use-community-bans-query-keys";
import { communityMembersQueryKeys } from "@/hooks/community-members-hooks/use-community-members-query-keys";
import { CreateCommunityBanDTO } from "@/types/community-bans/create-community-ban-dto";

export const useBanCommunityMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCommunityBanDTO) => communityBansService.banMember(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityBansQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                toast.success("User has been banned successfully.");
            }
        }
    });
};
