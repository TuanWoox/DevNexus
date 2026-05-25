import { postService } from "@/services/post-service";
import { CreatePostShareDTO } from "@/types/post/create-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useCreatePostShare = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreatePostShareDTO) => postService.createShare(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
            toast.success("Post shared successfully!");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Post could not be shared.");
        },
    });
};
