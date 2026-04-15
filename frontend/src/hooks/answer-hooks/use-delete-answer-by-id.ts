import { answerService } from "@/services/answer-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { answerQueryKeys } from "./use-answer-query-keys";

export const useDeleteAnswerById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (answerId: string) => answerService.deleteAnswerById(answerId),
        onSuccess: (data, answerId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.lists() });
                queryClient.removeQueries({ queryKey: answerQueryKeys.detail(answerId) });
            }
        }
    })
}