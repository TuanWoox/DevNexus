import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsService, MuteSettingDto } from '../../services/settings-service';
import { toast } from 'sonner';

export function useMuteSettings() {
  return useQuery({
    queryKey: ['notification-settings', 'mutes'],
    queryFn: notificationSettingsService.getMutes,
  });
}

export function useAddMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: MuteSettingDto) => notificationSettingsService.addMute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', 'mutes'] });
      toast.success('Notification muted');
    },
    onError: () => {
      toast.error('Failed to mute notification');
    },
  });
}

export function useRemoveMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: MuteSettingDto) => notificationSettingsService.removeMute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', 'mutes'] });
      toast.success('Notification unmuted');
    },
    onError: () => {
      toast.error('Failed to unmute notification');
    },
  });
}
