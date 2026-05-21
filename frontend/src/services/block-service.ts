import coreApi from "@/lib/axiosConfig";
import { PagedData } from "@/types/common/paged-data";
import type { ReturnResult } from "@/types/common/return-result";
import { Page } from "@/types/common/page";
import { SelectProfileBlockDTO } from "@/types/profile-block/select-profile-block-dto";
import { SelectBlockStatusDTO } from "@/types/profile-block/select-block-status-dto";



export const blockService = {
    blockProfile: async (blockedProfileId: string): Promise<ReturnResult<SelectProfileBlockDTO>> => {
        const { data } = await coreApi.post<ReturnResult<SelectProfileBlockDTO>>("/ProfileBlocks", { BlockedProfileId: blockedProfileId });
        return data;
    },

    unblockProfile: async (blockId: string): Promise<ReturnResult<boolean>> => {
        const { data } = await coreApi.delete<ReturnResult<boolean>>(`/ProfileBlocks/${blockId}`);
        return data;
    },

    getMyBlocksPaged: async (payload: Page<string>): Promise<PagedData<SelectProfileBlockDTO, string>> => {
        const { data } = await coreApi.post<ReturnResult<PagedData<SelectProfileBlockDTO, string>>>(
            "/ProfileBlocks/paging",
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    getBlockStatus: async (otherProfileId: string): Promise<SelectBlockStatusDTO> => {
        const { data } = await coreApi.get<ReturnResult<SelectBlockStatusDTO>>(`/ProfileBlocks/status/${otherProfileId}`);
        return data.result ?? {
            iBlockedThem: false,
            blockId: null,
            theyBlockedMe: false,
        };
    },
};
