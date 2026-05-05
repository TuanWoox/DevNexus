import coreApi from "@/lib/axiosConfig";
import type { ReturnResult } from "@/types/common/return-result";
import { Page } from "@/types/common/page";

export interface SelectProfileBlock {
    Id: string;
    OwnerId: string;
    BlockedProfileId: string;
}

export const blockService = {
    blockProfile: async (blockedProfileId: string): Promise<ReturnResult<SelectProfileBlock>> => {
        const { data } = await coreApi.post<ReturnResult<SelectProfileBlock>>("/ProfileBlocks", { BlockedProfileId: blockedProfileId });
        return data;
    },

    unblockProfile: async (blockId: string): Promise<ReturnResult<boolean>> => {
        const { data } = await coreApi.delete<ReturnResult<boolean>>(`/ProfileBlocks/${blockId}`);
        return data;
    },

    getMyBlocks: async (): Promise<SelectProfileBlock[]> => {
        const page: Page<string> = {
            pageNumber: 0,
            size: 200,
            totalElements: 0,
            filter: [],
            orders: [],
            selected: []
        }
        const { data } = await coreApi.post<ReturnResult<{ data: SelectProfileBlock[] }>>(
            "/ProfileBlocks/paging", page
        );
        return (data.result as any)?.data ?? [];
    },
};
