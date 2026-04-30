import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { SelectAnswerDTO } from "@/types/answer/select-answer-dto";
import { PagedData } from "@/types/common/paged-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { answerQueryKeys } from "../answer-hooks/use-answer-query-keys";

const applyVoteToAnswer = (answer: SelectAnswerDTO, voteRequestDTO: VoteRequestDTO): SelectAnswerDTO => {
    const isToggleOff = answer.currentUserVote === voteRequestDTO.isUpvote;
    let newUpvoteCount = answer.upvoteCount;
    let newDownvoteCount = answer.downvoteCount;
    let newCurrentUserVote: boolean | null;

    if (isToggleOff) {
        if (voteRequestDTO.isUpvote) newUpvoteCount -= 1;
        else newDownvoteCount -= 1;
        newCurrentUserVote = null;
    } else if (answer.currentUserVote == null) {
        if (voteRequestDTO.isUpvote) newUpvoteCount += 1;
        else newDownvoteCount += 1;
        newCurrentUserVote = voteRequestDTO.isUpvote;
    } else {
        if (voteRequestDTO.isUpvote) { newUpvoteCount += 1; newDownvoteCount -= 1; }
        else { newDownvoteCount += 1; newUpvoteCount -= 1; }
        newCurrentUserVote = voteRequestDTO.isUpvote;
    }

    return {
        ...answer,
        currentUserVote: newCurrentUserVote,
        upvoteCount: Math.max(0, newUpvoteCount),
        downvoteCount: Math.max(0, newDownvoteCount),
    };
};

export const useUpdateVoteByAnswerId = (answerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByAnswerId(answerId, voteRequestDTO),

        onMutate: async (voteRequestDTO) => {
            await queryClient.cancelQueries({ queryKey: answerQueryKeys.all });

            const previousDetail = queryClient.getQueryData<SelectAnswerDTO>(answerQueryKeys.detail(answerId));
            const previousLists = queryClient.getQueriesData<PagedData<SelectAnswerDTO, string>>({ queryKey: answerQueryKeys.lists() });

            if (previousDetail) {
                queryClient.setQueryData(answerQueryKeys.detail(answerId), applyVoteToAnswer(previousDetail, voteRequestDTO));
            }

            queryClient.setQueriesData<PagedData<SelectAnswerDTO, string>>(
                { queryKey: answerQueryKeys.lists() },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((answer) =>
                            answer.id === answerId ? applyVoteToAnswer(answer, voteRequestDTO) : answer
                        ),
                    };
                }
            );

            return { previousDetail, previousLists };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(answerQueryKeys.detail(answerId), context.previousDetail);
            }
            context?.previousLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        // onSuccess: intentionally empty — onMutate already patched RAM via setQueryData/setQueriesData.
        // Zero-refetch pattern: no invalidateQueries here.
    });
};
