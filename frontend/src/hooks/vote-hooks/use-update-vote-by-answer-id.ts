import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { answerQueryKeys } from "../answer-hooks/use-answer-query-keys";

export const useUpdateVoteByAnswerId = (answerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByAnswerId(answerId, voteRequestDTO),
        onSuccess: () => {
            // Refetch lại danh sách answer. (Tuỳ biến lại sử dụng answerQueryKeys nếu bạn đã tạo ra query factory cho answers)
            queryClient.invalidateQueries({ queryKey: answerQueryKeys.lists() });
        },
    });
};
