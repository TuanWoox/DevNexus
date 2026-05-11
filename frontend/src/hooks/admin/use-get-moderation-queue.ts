import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Page } from '@/types/common/page';
import { adminQueryKeys } from './admin-query-keys';
import { adminModerationService } from '@/services/admin-moderation-service';

export const useGetModerationQueue = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.moderation.paging(page),
    queryFn: () => adminModerationService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
