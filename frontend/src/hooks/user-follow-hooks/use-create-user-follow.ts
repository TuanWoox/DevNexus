import { userFollowService } from "@/services/user-follow-service";
import { CreateUserFollowDTO } from "@/types/user-follow/create-user-follow-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { userFollowQueryKeys } from "./use-user-follow-query-key";
import { toast } from "sonner";

export const useCreateUserFollow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserFollowDTO) => userFollowService.createUserFollow(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                toast.success("Follow action completed");
            }
        }
    })
}