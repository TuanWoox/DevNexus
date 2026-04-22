import { postService } from "@/services/post-service";
import { useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

export const useGetPostById = (postId: string, isEnabled: boolean = true) => {
    return useQuery({
        queryKey: postQueryKeys.detail(postId),
        queryFn: () => postService.getPostById(postId),
        enabled: !!postId && isEnabled,
    });
};

