import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminUsersService } from '@/services/admin-users-service';
import { Page } from '@/types/common/page';

export const useGetAdminUsers = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.users.paging(page),
    queryFn: () => adminUsersService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
