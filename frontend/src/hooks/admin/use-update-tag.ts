import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminTagsService } from '@/services/admin-tags-service';
import { UpdateTagDTO } from '@/types/admin/admin-tag-dto';

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateTagDTO) => adminTagsService.update(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tags.all });
    },
  });
};
