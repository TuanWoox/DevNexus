import type { ProfileSummary } from "../types/contracts";
import messageApi from "../../../lib/messageServiceAxiosConfig";
import type { ReturnResult } from "@/types/common/return-result";

export const profileService = {
    searchProfiles: async (
        query: string,
        excludeIds: string[] = []
    ): Promise<ReturnResult<ProfileSummary[]>> => {
        const excludeParam = excludeIds.length > 0 ? `&exclude=${excludeIds.join(",")}` : "";
        const { data } = await messageApi.get<ReturnResult<ProfileSummary[]>>(
            `/profiles/search?q=${encodeURIComponent(query)}${excludeParam}`
        );
        return data;
    },
};
