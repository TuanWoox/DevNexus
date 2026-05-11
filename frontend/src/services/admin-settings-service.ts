import api from '@/lib/axiosConfig'
import { BannedKeywordsDTO } from '@/types/admin/banned-keywords-dto'
import { CreateSettingDTO, SelectSettingDTO, UpdateSettingDTO } from '@/types/admin/admin-setting-dto'
import { Page } from '@/types/common/page'
import { PagedData } from '@/types/common/paged-data'
import { ReturnResult } from '@/types/common/return-result'

export const adminSettingsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<SelectSettingDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SelectSettingDTO, string>>>('/systemsettings/paging', payload)
    return data.result
  },

  create: async (dto: CreateSettingDTO): Promise<boolean> => {
    const { data } = await api.post<ReturnResult<boolean>>('/systemsettings', dto)
    return data.result
  },

  update: async (dto: UpdateSettingDTO): Promise<boolean> => {
    const { data } = await api.put<ReturnResult<boolean>>('/systemsettings', dto)
    return data.result
  },

  delete: async (ids: string[]): Promise<boolean> => {
    const { data } = await api.delete<ReturnResult<boolean>>('/systemsettings', { data: ids })
    return data.result
  },

  getBannedKeywords: async (): Promise<BannedKeywordsDTO> => {
    const { data } = await api.get<ReturnResult<BannedKeywordsDTO>>('/systemsettings/moderation/banned-keywords')
    return data.result
  },

  updateBannedKeywords: async (dto: BannedKeywordsDTO): Promise<boolean> => {
    const { data } = await api.put<ReturnResult<boolean>>('/systemsettings/moderation/banned-keywords', dto)
    return data.result
  },
}
