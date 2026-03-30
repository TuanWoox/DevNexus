import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { CreateCommentDTO } from "@/types/comment/create-comment-dto";
import { SelectCommentDTO } from "@/types/comment/select-comment-dto";
import { UpdateCommentDTO } from "@/types/comment/update-comment-dto";

export const commentService = {
    createComment: async (createCommentDTO: CreateCommentDTO): Promise<SelectCommentDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommentDTO>>('/Comments', createCommentDTO);
        return data.result;
    },

    getCommentById: async (commentId: string): Promise<SelectCommentDTO> => {
        const { data } = await api.get<ReturnResult<SelectCommentDTO>>(`/Comments/${commentId}`);
        return data.result;
    },

    getOwnComments: async (payload: Page<string>): Promise<PagedData<SelectCommentDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommentDTO, string>>>('/Comments/my-comments', payload);
        return data.result;
    },

    getRepliesByCommentId: async (commentId: string, payload: Page<string>): Promise<PagedData<SelectCommentDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommentDTO, string>>>(`/Comments/${commentId}/replies`, payload);
        return data.result;
    },

    updateComment: async (updateCommentDTO: UpdateCommentDTO): Promise<SelectCommentDTO> => {
        const { data } = await api.put<ReturnResult<SelectCommentDTO>>('/Comments', updateCommentDTO);
        return data.result;
    },

    deleteCommentById: async (commentId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/Comments/${commentId}`);
        return data.result;
    },

    getCommentsByPostId: async (postId: string, payload: Page<string>): Promise<PagedData<SelectCommentDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommentDTO, string>>>(`/Comments/by-post/${postId}`, payload);
        return data.result;
    },

    getCommentsByAnswerId: async (answerId: string, payload: Page<string>): Promise<PagedData<SelectCommentDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommentDTO, string>>>(`/Comments/by-answer/${answerId}`, payload);
        return data.result;
    }
}