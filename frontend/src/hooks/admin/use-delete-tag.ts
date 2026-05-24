import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { adminTagsService } from '@/services/admin-tags-service';

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminTagsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tags.all });
      toast.success('Tag deleted');
    },
  });
};
