import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectFollowRequestDTO } from "@/types/follow-request/select-follow-request-dto";
import { CreateUserFollowDTO } from "@/types/user-follow/create-user-follow-dto";
import { SelectUserFollowDTO } from "@/types/user-follow/select-user-follow-dto";

export const userFollowService = {
    createUserFollow: async (payload: CreateUserFollowDTO): Promise<SelectUserFollowDTO | SelectFollowRequestDTO> => {
        const { data } = await api.post<ReturnResult<SelectUserFollowDTO | SelectFollowRequestDTO>>('/UserFollows', payload);
        return data.result;
    },

    getFollowers: async (payload: Page<string>): Promise<PagedData<SelectUserFollowDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectUserFollowDTO, string>>>('/UserFollows/followers/paging', payload);
        return data.result ?? { data: [], page: payload };
    },

    getFollowings: async (payload: Page<string>): Promise<PagedData<SelectUserFollowDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectUserFollowDTO, string>>>('/UserFollows/followings/paging', payload);
        return data.result ?? { data: [], page: payload };
    },

    getFollowersByProfileId: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectUserFollowDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectUserFollowDTO, string>>>(`/UserFollows/${profileId}/followers/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    getFollowingsByProfileId: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectUserFollowDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectUserFollowDTO, string>>>(`/UserFollows/${profileId}/followings/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    deleteById: async (followId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/UserFollows/${followId}`);
        return data.result;
    },

    bulkDelete: async (followIds: string[]): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>(
            '/UserFollows',
            { data: { selected: followIds } }
        );
        return data.result;
    },
};