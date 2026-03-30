import { postService } from "@/services/post-service";
import { CreatePostDTO } from "@/types/post/create-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreatePostDTO) => postService.createPost(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                toast.success("Post created successfully!");
            }
        }
    });
};
