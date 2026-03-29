import { postService } from "@/services/post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

export const useGetPostsWithPagination = (payload: Page<string>) => {
    return useQuery({
        queryKey: postQueryKeys.list(payload),
        queryFn: () => postService.getPostsWithPagination(payload),
        placeholderData: keepPreviousData,
    });
};
