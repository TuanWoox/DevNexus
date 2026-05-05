import api from "@/lib/axiosConfig";
import { AdminAiUsageSummaryDTO } from "@/types/admin/ai-usage-dto";
import { ReturnResult } from "@/types/common/return-result";

export const adminAiUsageService = {
  getSummary: async (from: string, to: string): Promise<AdminAiUsageSummaryDTO> => {
    const { data } = await api.get<ReturnResult<AdminAiUsageSummaryDTO>>('/aiusagelogs/summary', {
      params: { from, to },
    });
    return data.result;
  },
};
