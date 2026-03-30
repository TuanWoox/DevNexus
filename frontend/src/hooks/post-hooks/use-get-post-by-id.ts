import { postService } from "@/services/post-service";
import { useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

export const useGetPostById = (postId: string) => {
    return useQuery({
        queryKey: postQueryKeys.detail(postId),
        queryFn: () => postService.getPostById(postId),
        enabled: !!postId,
    });
};

