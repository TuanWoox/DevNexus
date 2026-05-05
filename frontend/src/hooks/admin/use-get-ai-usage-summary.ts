import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminAiUsageService } from '@/services/admin-ai-usage-service';

export const useGetAiUsageSummary = (from: string, to: string) => {
  return useQuery({
    queryKey: adminQueryKeys.aiUsage.summary(from, to),
    queryFn: () => adminAiUsageService.getSummary(from, to),
    enabled: !!from && !!to,
  });
};
