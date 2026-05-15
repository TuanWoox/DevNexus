import { userFollowService } from "@/services/user-follow-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { userFollowQueryKeys } from "./use-user-follow-query-key";
import { toast } from "sonner";

export const useDeleteFollowById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (followId: string) => userFollowService.deleteById(followId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                toast.success("Unfollowed successfully");
            }
        }
    })
}