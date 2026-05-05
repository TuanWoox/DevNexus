import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminQueueResolveDTO } from '@/types/admin/admin-queue-entry-dto';
import { adminQueryKeys } from './admin-query-keys';
import { adminModerationService } from '@/services/admin-moderation-service';

export const useApproveQueueEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AdminQueueResolveDTO) => adminModerationService.approve(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      toast.success('Entry approved');
    },
    onError: () => {
      toast.error('Failed to approve entry');
    },
  });
};
