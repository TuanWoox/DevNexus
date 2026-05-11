import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { CommunityPageRequest } from "@/types/common/community-page-request";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { CreateCommunityDTO } from "@/types/community/create-community-dto";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { UpdateCommunityDTO } from "@/types/community/update-community-dto";

export const communityService = {
    createCommunity: async (createCommunityDTO: CreateCommunityDTO): Promise<SelectCommunityDTO> => {
        const { data } = await api.post<ReturnResult<SelectCommunityDTO>>('/Communities', createCommunityDTO);
        return data.result;
    },

    getCommunityById: async (communityId: string): Promise<SelectCommunityDTO> => {
        const { data } = await api.get<ReturnResult<SelectCommunityDTO>>(`/Communities/${communityId}`);
        return data.result;
    },

    // Legacy: kept for backward compat, defaults to no mode filter on backend
    getCommunitiesWithPagination: async (payload: Page<string>): Promise<PagedData<SelectCommunityDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityDTO, string>>>('/Communities/paging', payload);
        return data.result ?? { data: [], page: payload };
    },

    // Mode-aware paging (EXPLORE / YOURS)
    getCommunitiesByMode: async (request: CommunityPageRequest): Promise<PagedData<SelectCommunityDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityDTO, string>>>('/Communities/paging', request);
        return data.result ?? { data: [], page: request };
    },

    updateCommunity: async (updateCommunityDTO: UpdateCommunityDTO): Promise<SelectCommunityDTO> => {
        const { data } = await api.put<ReturnResult<SelectCommunityDTO>>('/Communities', updateCommunityDTO);
        return data.result;
    },

    deleteCommunityById: async (communityId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/Communities/${communityId}`);
        return data.result;
    },

    deleteCommunities: async (payload: Page<string>): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>('/Communities', {
            data: payload // Bọc payload vào trong property 'data' của AxiosRequestConfig
        });
        return data.result;
    }
}