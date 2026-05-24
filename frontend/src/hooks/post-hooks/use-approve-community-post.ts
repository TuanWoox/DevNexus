import { postService } from "@/services/post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useApproveCommunityPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => postService.approveCommunityPost(postId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.id) });
            toast.success("Post approved.");
        }
    });
};
