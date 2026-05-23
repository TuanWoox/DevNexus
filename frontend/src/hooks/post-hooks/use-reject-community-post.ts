import { postService } from "@/services/post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useRejectCommunityPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
            postService.rejectCommunityPost(postId, reason),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.id) });
            toast.success("Post rejected.");
        }
    });
};
