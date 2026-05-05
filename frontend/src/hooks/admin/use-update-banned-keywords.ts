import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { adminSettingsService } from '@/services/admin-settings-service';
import { BannedKeywordsDTO } from '@/types/admin/banned-keywords-dto';

export const useUpdateBannedKeywords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BannedKeywordsDTO) => adminSettingsService.updateBannedKeywords(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings.bannedKeywords });
      toast.success('Keywords saved');
    },
    onError: () => {
      toast.error('Failed to save keywords');
    },
  });
};
