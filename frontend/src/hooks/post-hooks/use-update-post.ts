import { postService } from "@/services/post-service";
import { UpdatePostDTO } from "@/types/post/update-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdatePostDTO) => postService.updatePost(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.id) });
                toast.success("Post updated successfully!");
            }
        }
    });
};
