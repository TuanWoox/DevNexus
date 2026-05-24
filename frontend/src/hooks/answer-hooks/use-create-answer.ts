import { answerService } from "@/services/answer-service";
import { CreateAnswerDTO } from "@/types/answer/create-answer-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { answerQueryKeys } from "./use-answer-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";

export const useCreateAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (createAnswerDTO: CreateAnswerDTO) => answerService.createAnswer(createAnswerDTO),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(data.qaPostId) });
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.listByPost(data.qaPostId) });
            }
        }
    })
}