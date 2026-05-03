import type { PagedData, ProfileSummary } from "../types/contracts";
import messageApi from "../../../lib/messageServiceAxiosConfig";
import type { ReturnResult } from "@/types/common/return-result";
import type { Page } from "@/types/common/page";

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

    // POST with Page body — paginated, matches /chats/search pattern
    searchFollowedProfiles: async (
        page: Page<string>
    ): Promise<ReturnResult<PagedData<string, ProfileSummary>>> => {
        const { data } = await messageApi.post<ReturnResult<PagedData<string, ProfileSummary>>>(
            `/profiles/search/following`,
            page
        );
        return data;
    },

    getProfileById: async (
        profileId: string
    ): Promise<ReturnResult<ProfileSummary>> => {
        const { data } = await messageApi.get<ReturnResult<ProfileSummary>>(
            `/profiles/${profileId}`
        );
        return data;
    },
};
