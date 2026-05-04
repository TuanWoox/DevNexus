import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { CreateQAPostDTO } from "@/types/qa-post/create-qa-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { UpdateQAPostDTO } from "@/types/qa-post/update-qa-post-dto";

export const qaPostService = {
    createQAPost: async (createQAPostDTO: CreateQAPostDTO): Promise<SelectQAPostDTO> => {
        const { data } = await api.post<ReturnResult<SelectQAPostDTO>>('/QAPosts', createQAPostDTO);
        return data.result;
    },

    getQAPostById: async (qaPostId: string): Promise<SelectQAPostDTO> => {
        const { data } = await api.get<ReturnResult<SelectQAPostDTO>>(`/QAPosts/${qaPostId}`);
        return data.result;
    },

    getQAPostWithPagination: async (payload: Page<string>): Promise<PagedData<SelectQAPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectQAPostDTO, string>>>('/QAPosts/paging', payload);
        return data.result ?? { data: [], page: payload };
    },

    getQAPostsByProfileId: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectQAPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectQAPostDTO, string>>>(`/QAPosts/profile/${profileId}/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    updateQAPost: async (updateQAPostDTO: UpdateQAPostDTO): Promise<SelectQAPostDTO> => {
        const { data } = await api.put<ReturnResult<SelectQAPostDTO>>('/QAPosts', updateQAPostDTO);
        return data.result;
    },

    deleteQAPostById: async (qaPostId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/QAPosts/${qaPostId}`);
        return data.result;
    },

    deleteQAPosts: async (payload: Page<string>): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>('/QAPosts', {
            data: payload // Bọc payload vào trong property 'data' của AxiosRequestConfig
        });
        return data.result;
    }
}