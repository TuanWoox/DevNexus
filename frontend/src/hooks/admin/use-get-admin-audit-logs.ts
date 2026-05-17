import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminAuditLogsService } from '@/services/admin-audit-logs-service'
import { Page } from '@/types/common/page'
import { adminQueryKeys } from './admin-query-keys'

export const useGetAdminAuditLogs = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.auditLogs.paging(page),
    queryFn: () => adminAuditLogsService.getPaging(page),
    placeholderData: keepPreviousData,
  })
}
