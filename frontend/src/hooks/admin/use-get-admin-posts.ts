import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Page } from '@/types/common/page';
import { adminQueryKeys } from './admin-query-keys';
import { adminPostsService } from '@/services/admin-posts-service';

export const useGetAdminPosts = (page: Page<string>) => {
  return useQuery({
    queryKey: adminQueryKeys.posts.paging(page),
    queryFn: () => adminPostsService.getPaging(page),
    placeholderData: keepPreviousData,
  });
};
