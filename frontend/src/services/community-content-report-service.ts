import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import { ReportContentDTO } from "@/types/community-content-report/report-content-dto";

export const communityContentReportService = {
    reportContent: async (payload: ReportContentDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>('/CommunityContentReport', payload);
        return data.result;
    },
};
