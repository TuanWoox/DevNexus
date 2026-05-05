import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { adminPostsService } from '@/services/admin-posts-service';

export const useForceRejectPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminPostsService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      toast.success('Post flagged');
    },
    onError: () => {
      toast.error('Failed to flag post');
    },
  });
};
