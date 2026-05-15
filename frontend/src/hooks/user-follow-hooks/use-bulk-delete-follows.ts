import { userFollowService } from "@/services/user-follow-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { userFollowQueryKeys } from "./use-user-follow-query-key";

export const useBulkDeleteFollows = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: string[]) => userFollowService.bulkDelete(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
            }
        }
    })
}