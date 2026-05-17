import api from '@/lib/axiosConfig'
import { AdminAuditLogDTO } from '@/types/admin/admin-audit-log-dto'
import { Page } from '@/types/common/page'
import { PagedData } from '@/types/common/paged-data'
import { ReturnResult } from '@/types/common/return-result'

export const adminAuditLogsService = {
  getPaging: async (payload: Page<string>): Promise<PagedData<AdminAuditLogDTO, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<AdminAuditLogDTO, string>>>('/adminauditlogs/paging', payload)
    return data.result
  },
}
