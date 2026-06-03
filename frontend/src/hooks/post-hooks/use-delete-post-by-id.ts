import { postService } from "@/services/post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useDeletePostById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => postService.deletePostById(postId),
        onSuccess: (data, postId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                queryClient.removeQueries({ queryKey: postQueryKeys.detail(postId) });
                toast.success("Post deleted successfully!");
            }
        }
    });
};
