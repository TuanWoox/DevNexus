import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminQueueResolveDTO } from '@/types/admin/admin-queue-entry-dto';
import { adminQueryKeys } from './admin-query-keys';
import { adminModerationService } from '@/services/admin-moderation-service';

export const useRejectQueueEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AdminQueueResolveDTO) => adminModerationService.reject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
    },
  });
};
