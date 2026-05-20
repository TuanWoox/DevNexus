import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import { ReportContentDTO } from "@/types/community-content-report/report-content-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ContentType } from "@/types/content-media/content-type";

export const communityContentReportService = {
    reportContent: async (communityId: string, payload: ReportContentDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>(`/CommunityContentReport/${communityId}`, payload);
        return data.result;
    },

    getPagingDataForAdminAndModerator: async <T>(
        communityId: string,
        contentType: ContentType,
        payload: Page<string>
    ): Promise<PagedData<T, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<T, string>>>(
            `/CommunityContentReport/${communityId}/${contentType}/admin-moderator/paging`,
            payload
        );
        return data.result;
    },

    getPagingDataForCurrentUser: async <T>(
        communityId: string,
        contentType: ContentType,
        payload: Page<string>
    ): Promise<PagedData<T, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<T, string>>>(
            `/CommunityContentReport/${communityId}/${contentType}/mine/paging`,
            payload
        );
        return data.result;
    },
};

