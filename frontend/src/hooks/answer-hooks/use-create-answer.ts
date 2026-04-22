import { answerService } from "@/services/answer-service";
import { CreateAnswerDTO } from "@/types/answer/create-answer-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { answerQueryKeys } from "./use-answer-query-keys";

export const useCreateAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (createAnswerDTO: CreateAnswerDTO) => answerService.createAnswer(createAnswerDTO),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.listByPost(data.qaPostId) });
            }
        }
    })
}