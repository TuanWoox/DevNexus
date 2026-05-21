import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { AdminForceRejectPostDTO, adminPostsService } from '@/services/admin-posts-service';

interface ForceRejectPostVariables extends AdminForceRejectPostDTO {
  id: string;
}

export const useForceRejectPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reasonText, moderatorNote }: ForceRejectPostVariables) =>
      adminPostsService.reject(id, { reasonText, moderatorNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      toast.success('Post flagged');
    },
  });
};
