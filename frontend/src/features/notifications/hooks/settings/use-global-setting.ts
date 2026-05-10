import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsService } from '../../services/settings-service';
import { toast } from 'sonner';

export function useGlobalSetting() {
  return useQuery({
    queryKey: ['notification-settings', 'global'],
    queryFn: notificationSettingsService.getGlobalSetting,
  });
}

export function useUpdateGlobalSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allNotifications: boolean) => notificationSettingsService.updateGlobalSetting(allNotifications),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-settings', 'global'], data);
      toast.success(
        data.AllNotifications
          ? 'Notifications enabled'
          : 'Notifications disabled'
      );
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    },
  });
}
