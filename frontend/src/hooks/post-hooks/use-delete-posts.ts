import { postService } from "@/services/post-service";
import { Page } from "@/types/common/page";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";

export const useDeletePosts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Page<string>) => postService.deletePosts(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                toast.success(`Deleted ${data} posts successfully!`);
            }
        }
    });
};
