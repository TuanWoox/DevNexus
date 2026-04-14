import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { answerQueryKeys } from "./use-answer-query-keys";
import { answerService } from "@/services/answer-service";

export const useGetAnswersByPostId = (postId: string, isEnabled: boolean = true, payload: Page<string>) => {
    return useQuery({
        queryKey: answerQueryKeys.listByPost(postId, payload),
        queryFn: () => answerService.getAnswersByPostId(postId, payload),
        enabled: !!postId && isEnabled,
        placeholderData: keepPreviousData,
    });
};