import api from "@/lib/axiosConfig";
import { CreateAnswerDTO } from "@/types/answer/create-answer-dto";
import { SelectAnswerDTO } from "@/types/answer/select-answer-dto";
import { UpdateAnswerDTO } from "@/types/answer/update-answer-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

export const answerService = {
    createAnswer: async (createAnswerDTO: CreateAnswerDTO): Promise<SelectAnswerDTO> => {
        const { data } = await api.post<ReturnResult<SelectAnswerDTO>>('/Answers', createAnswerDTO);
        return data.result;
    },

    getAnswerById: async (answerId: string): Promise<SelectAnswerDTO> => {
        const { data } = await api.get<ReturnResult<SelectAnswerDTO>>(`/Answers/${answerId}`);
        return data.result;
    },

    getAnswersByPostId: async (postId: string, payload: Page<string>): Promise<PagedData<SelectAnswerDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectAnswerDTO, string>>>(`/Answers/${postId}/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    updateAnswer: async (updateAnswerDTO: UpdateAnswerDTO): Promise<SelectAnswerDTO> => {
        const { data } = await api.put<ReturnResult<SelectAnswerDTO>>('/Answers', updateAnswerDTO);
        return data.result;
    },

    deleteAnswerById: async (answerId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/Answers/${answerId}`);
        return data.result;
    },

    acceptAnswerById: async (answerId: string): Promise<boolean> => {
        const { data } = await api.put<ReturnResult<boolean>>(`/Answers/${answerId}/accept`);
        return data.result;
    }
}
