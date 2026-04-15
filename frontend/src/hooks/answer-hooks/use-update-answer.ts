import { answerService } from "@/services/answer-service";
import { UpdateAnswerDTO } from "@/types/answer/update-answer-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { answerQueryKeys } from "./use-answer-query-keys";

export const useUpdateAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateAnswerDTO: UpdateAnswerDTO) => answerService.updateAnswer(updateAnswerDTO),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.listByPost(data.qaPostId) })
            }
        }
    })
}