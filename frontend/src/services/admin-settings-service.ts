import api from "@/lib/axiosConfig";
import { BannedKeywordsDTO } from "@/types/admin/banned-keywords-dto";
import { ReturnResult } from "@/types/common/return-result";

export const adminSettingsService = {
  getBannedKeywords: async (): Promise<BannedKeywordsDTO> => {
    const { data } = await api.get<ReturnResult<BannedKeywordsDTO>>('/systemsettings/moderation/banned-keywords');
    return data.result;
  },

  updateBannedKeywords: async (dto: BannedKeywordsDTO): Promise<boolean> => {
    const { data } = await api.put<ReturnResult<boolean>>('/systemsettings/moderation/banned-keywords', dto);
    return data.result;
  },
};
