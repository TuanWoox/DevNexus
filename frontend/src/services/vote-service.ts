import api from "@/lib/axiosConfig"
import { ReturnResult } from "@/types/common/return-result"
import { VoteRequestDTO } from "@/types/vote/vote-request-dto"

export const voteService = {
    updateVoteByPostId: async (postId: string, voteRequestDTO: VoteRequestDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(`/Votes/post/${postId}`, voteRequestDTO);
        return data.result;
    },

    updateVoteByAnswerId: async (answerId: string, voteRequestDTO: VoteRequestDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(`/Votes/answer/${answerId}`, voteRequestDTO);
        return data.result;
    },

    updateVoteByCommentId: async (commentId: string, voteRequestDTO: VoteRequestDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(`/Votes/comment/${commentId}`, voteRequestDTO);
        return data.result;
    }
}