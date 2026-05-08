import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminSettingsService } from '@/services/admin-settings-service';

export const useGetBannedKeywords = () => {
  return useQuery({
    queryKey: adminQueryKeys.settings.bannedKeywords,
    queryFn: () => adminSettingsService.getBannedKeywords(),
  });
};
