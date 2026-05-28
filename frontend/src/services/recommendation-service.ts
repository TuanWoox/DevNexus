import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import {
    RecommendationFeedbackDTO,
    RecommendationInteractionDTO,
} from "@/types/recommendation/recommendation-dtos";

export const recommendationService = {
    getPersonalizedPostFeed: async (payload: Page<string>): Promise<PagedData<SelectPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectPostDTO, string>>>(
            "/Recommendations/posts/feed/paging",
            payload,
            { suppressToast: true }
        );
        return data.result ?? { data: [], page: payload };
    },

    getPersonalizedQAPostFeed: async (payload: Page<string>): Promise<PagedData<SelectQAPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectQAPostDTO, string>>>(
            "/Recommendations/qaposts/feed/paging",
            payload,
            { suppressToast: true }
        );
        return data.result ?? { data: [], page: payload };
    },

    getPersonalizedCommunityFeed: async (payload: Page<string>): Promise<PagedData<SelectCommunityDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectCommunityDTO, string>>>(
            "/Recommendations/communities/feed/paging",
            payload,
            { suppressToast: true }
        );
        return data.result ?? { data: [], page: payload };
    },

    getTrendingPosts: async (period = "7d", limit = 5): Promise<SelectPostDTO[]> => {
        const { data } = await api.get<ReturnResult<SelectPostDTO[]>>("/Recommendations/trending/posts", {
            params: { period, limit },
            suppressToast: true,
        });
        return data.result ?? [];
    },

    getTrendingCommunities: async (period = "7d", limit = 5): Promise<SelectCommunityDTO[]> => {
        const { data } = await api.get<ReturnResult<SelectCommunityDTO[]>>("/Recommendations/trending/communities", {
            params: { period, limit },
            suppressToast: true,
        });
        return data.result ?? [];
    },

    trackInteraction: async (payload: RecommendationInteractionDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(
            "/Recommendations/interactions/track",
            payload,
            { suppressToast: true }
        );
        return data.result ?? false;
    },

    submitFeedback: async (payload: RecommendationFeedbackDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(
            "/Recommendations/feedback",
            payload,
            { suppressToast: true }
        );
        return data.result ?? false;
    },
};
