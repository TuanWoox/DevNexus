import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsService } from '../../services/settings-service';
import { toast } from 'sonner';

export function useGlobalSetting() {
  return useQuery({
    queryKey: ['notification-settings', 'global'],
    queryFn: async () => {
      const res = await notificationSettingsService.getGlobalSetting();
      if (res.result) {
        return res.result;
      }
      toast.error(res.message || 'Failed to load notification settings');
      return { AllNotifications: true };
    },
  });
}

export function useUpdateGlobalSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allNotifications: boolean) => notificationSettingsService.updateGlobalSetting(allNotifications),
    onSuccess: (res) => {
      if (res.result) {
        queryClient.setQueryData(['notification-settings', 'global'], res.result);
        toast.success(
          res.result.AllNotifications
            ? 'Notifications enabled'
            : 'Notifications disabled'
        );
      } else {
        toast.error(res.message || 'Failed to update notification settings');
      }
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    },
  });
}
