import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from './admin-query-keys'
import { adminSettingsService } from '@/services/admin-settings-service'
import { Page } from '@/types/common/page'

const allSettingsPage: Page<string> = {
  size: 500,
  pageNumber: 0,
  totalElements: 0,
  orders: [],
  filter: [],
  selected: [],
}

export const useGetAdminSettings = () => {
  return useQuery({
    queryKey: adminQueryKeys.settings.all,
    queryFn: () => adminSettingsService.getPaging(allSettingsPage),
  })
}
