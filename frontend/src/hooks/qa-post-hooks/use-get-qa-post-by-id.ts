import { useQuery } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { qaPostService } from "@/services/qa-post-service";

export const useGetQAPostById = (qaPostId: string, isEnabled: boolean = true) => {
    return useQuery({
        queryKey: qaPostQueryKeys.detail(qaPostId),
        queryFn: () => qaPostService.getQAPostById(qaPostId),
        enabled: !!qaPostId && isEnabled,
    });
};

