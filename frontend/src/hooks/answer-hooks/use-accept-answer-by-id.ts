import { answerService } from "@/services/answer-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { answerQueryKeys } from "./use-answer-query-keys";

export const useAcceptAnswerById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (answerId: string) => answerService.acceptAnswerById(answerId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.lists() });
            }
        }
    })
}