import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qaPostService } from "@/services/qa-post-service";
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { UpdateQAPostDTO } from "@/types/qa-post/update-qa-post-dto";
import { updatePostInCaches } from "@/hooks/post-hooks/post-cache-helper";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";

export const useUpdateQAPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateQAPostDTO) => qaPostService.updateQAPost(payload),
        onSuccess: (data) => {
            if (data) {
                updatePostInCaches(queryClient, data);
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.id) });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(data.id) });
                toast.success("QA post updated successfully!");
            }
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Failed to update question";
            toast.error(message);
        }
    });
};
