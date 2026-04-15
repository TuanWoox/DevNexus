import { useQuery } from "@tanstack/react-query"
import { answerQueryKeys } from "./use-answer-query-keys"
import { answerService } from "@/services/answer-service"

export const useGetAnswerById = (answerId: string) => {
    return useQuery({
        queryKey: answerQueryKeys.detail(answerId),
        queryFn: () => answerService.getAnswerById(answerId),
        enabled: !!answerId,
    });
};