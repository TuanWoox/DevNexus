import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { SelectCommentDTO } from "@/types/comment/select-comment-dto";
import { SelectAnswerDTO } from "@/types/answer/select-answer-dto";
import { PagedData } from "@/types/common/paged-data";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { commentQueryKeys } from "@/hooks/comment-hooks/use-comment-query-keys";
import { answerQueryKeys } from "@/hooks/answer-hooks/use-answer-query-keys";

const applyVoteToComment = (comment: SelectCommentDTO, voteRequestDTO: VoteRequestDTO): SelectCommentDTO => {
    const isToggleOff = comment.currentUserVote === voteRequestDTO.isUpvote;
    let newUpvoteCount = comment.upvoteCount;
    let newDownvoteCount = comment.downvoteCount;
    let newCurrentUserVote: boolean | null;

    if (isToggleOff) {
        if (voteRequestDTO.isUpvote) newUpvoteCount -= 1;
        else newDownvoteCount -= 1;
        newCurrentUserVote = null;
    } else if (comment.currentUserVote == null) {
        if (voteRequestDTO.isUpvote) newUpvoteCount += 1;
        else newDownvoteCount += 1;
        newCurrentUserVote = voteRequestDTO.isUpvote;
    } else {
        if (voteRequestDTO.isUpvote) { newUpvoteCount += 1; newDownvoteCount -= 1; }
        else { newDownvoteCount += 1; newUpvoteCount -= 1; }
        newCurrentUserVote = voteRequestDTO.isUpvote;
    }

    return {
        ...comment,
        currentUserVote: newCurrentUserVote,
        upvoteCount: Math.max(0, newUpvoteCount),
        downvoteCount: Math.max(0, newDownvoteCount),
    };
};

const applyVoteToCommentOrReplies = (
    comment: SelectCommentDTO,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): SelectCommentDTO => {
    if (comment.id === commentId) {
        return applyVoteToComment(comment, voteRequestDTO);
    }
    if (comment.replies && comment.replies.length > 0) {
        return {
            ...comment,
            replies: comment.replies.map((reply) =>
                reply.id === commentId ? applyVoteToComment(reply, voteRequestDTO) : reply
            ),
        };
    }
    return comment;
};

const applyVoteToCommentInfiniteList = (
    oldData: InfiniteData<PagedData<SelectCommentDTO, string>> | undefined,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): InfiniteData<PagedData<SelectCommentDTO, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((comment) =>
                applyVoteToCommentOrReplies(comment, commentId, voteRequestDTO)
            ),
        })),
    };
};

const applyVoteToCommentPagedList = (
    oldData: PagedData<SelectCommentDTO, string> | undefined,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): PagedData<SelectCommentDTO, string> | undefined => {
    if (!oldData || !oldData.data) return oldData;
    return {
        ...oldData,
        data: oldData.data.map((comment) =>
            applyVoteToCommentOrReplies(comment, commentId, voteRequestDTO)
        ),
    };
};

const applyVoteToCommentInAnswer = (
    answer: SelectAnswerDTO,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): SelectAnswerDTO => {
    if (!answer.replies || answer.replies.length === 0) return answer;
    return {
        ...answer,
        replies: answer.replies.map((reply) =>
            reply.id === commentId ? applyVoteToComment(reply, voteRequestDTO) : reply
        ),
    };
};

const applyVoteToCommentInAnswerInfiniteList = (
    oldData: InfiniteData<PagedData<SelectAnswerDTO, string>> | undefined,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): InfiniteData<PagedData<SelectAnswerDTO, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((answer) => applyVoteToCommentInAnswer(answer, commentId, voteRequestDTO)),
        })),
    };
};

const applyVoteToCommentInAnswerPagedList = (
    oldData: PagedData<SelectAnswerDTO, string> | undefined,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): PagedData<SelectAnswerDTO, string> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        data: oldData.data.map((answer) => applyVoteToCommentInAnswer(answer, commentId, voteRequestDTO)),
    };
};

export const useUpdateVoteByCommentId = (commentId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByCommentId(commentId, voteRequestDTO),

        onMutate: async (voteRequestDTO) => {
            await queryClient.cancelQueries({ queryKey: commentQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: answerQueryKeys.all });

            const previousDetail = queryClient.getQueryData<SelectCommentDTO>(commentQueryKeys.detail(commentId));
            const previousCommentLists = queryClient.getQueriesData<any>({ queryKey: commentQueryKeys.all });
            const previousAnswerLists = queryClient.getQueriesData<any>({ queryKey: answerQueryKeys.lists() });

            if (previousDetail) {
                queryClient.setQueryData(commentQueryKeys.detail(commentId), applyVoteToComment(previousDetail, voteRequestDTO));
            }

            // Update comments queries (excluding details)
            previousCommentLists.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                const keyArray = queryKey as string[];
                if (keyArray[1] === 'detail') return;

                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToCommentInfiniteList(oldData, commentId, voteRequestDTO));
                } else if ("data" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToCommentPagedList(oldData, commentId, voteRequestDTO));
                }
            });

            // Update comment nested inside answers queries
            previousAnswerLists.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToCommentInAnswerInfiniteList(oldData, commentId, voteRequestDTO));
                } else if ("data" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToCommentInAnswerPagedList(oldData, commentId, voteRequestDTO));
                }
            });

            return { previousDetail, previousCommentLists, previousAnswerLists };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(commentQueryKeys.detail(commentId), context.previousDetail);
            }
            context?.previousCommentLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.previousAnswerLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },
    });
};
