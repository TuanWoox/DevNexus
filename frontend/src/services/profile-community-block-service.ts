import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectProfileCommunityBlockDTO } from "@/types/profile-community-block/select-profile-community-block-dto";

export const profileCommunityBlockService = {
    blockCommunity: async (communityId: string): Promise<ReturnResult<SelectProfileCommunityBlockDTO>> => {
        const { data } = await api.post<ReturnResult<SelectProfileCommunityBlockDTO>>(
            "/ProfileCommunityBlocks",
            { communityId }
        );
        return data;
    },

    unblockCommunity: async (blockId: string): Promise<ReturnResult<boolean>> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/ProfileCommunityBlocks/${blockId}`);
        return data;
    },

    getMyBlockedCommunitiesPaged: async (payload: Page<string>): Promise<PagedData<SelectProfileCommunityBlockDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectProfileCommunityBlockDTO, string>>>(
            "/ProfileCommunityBlocks/paging",
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    bulkUnblockCommunities: async (payload: Page<string>): Promise<ReturnResult<number>> => {
        const { data } = await api.delete<ReturnResult<number>>("/ProfileCommunityBlocks", {
            data: payload,
        });
        return data;
    },
};
