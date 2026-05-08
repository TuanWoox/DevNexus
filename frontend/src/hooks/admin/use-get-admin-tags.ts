import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminTagsService } from '@/services/admin-tags-service';
import { Page } from '@/types/common/page';

export const useGetAdminTags = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.tags.paging(page),
    queryFn: () => adminTagsService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
