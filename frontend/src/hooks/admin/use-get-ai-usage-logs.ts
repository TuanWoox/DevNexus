import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminAiUsageService } from '@/services/admin-ai-usage-service';
import { Page } from '@/types/common/page';

export const useGetAiUsageLogs = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.aiUsage.paging(page),
    queryFn: () => adminAiUsageService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
