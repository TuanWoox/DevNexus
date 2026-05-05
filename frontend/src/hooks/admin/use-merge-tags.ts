import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminTagsService } from '@/services/admin-tags-service';
import { MergeTagsDTO } from '@/types/admin/admin-tag-dto';

export const useMergeTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MergeTagsDTO) => adminTagsService.merge(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tags.all });
    },
  });
};
