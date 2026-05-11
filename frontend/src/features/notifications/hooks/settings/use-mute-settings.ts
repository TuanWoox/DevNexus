import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsService, MuteSettingDto } from '../../services/settings-service';
import { toast } from 'sonner';
import { updateMuteStatusInCache } from '../../utils/notification-cache-helper';

const PAGE_SIZE = 20;

export function useMuteSettings() {
  return useInfiniteQuery({
    queryKey: ['notification-settings', 'mutes'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await notificationSettingsService.getMutesPaging({
        pageNumber: pageParam as number,
        size: PAGE_SIZE,
        selected: [],
      });
      if (res.result) {
        return res.result;
      }
      toast.error(res.message || 'Failed to load muted notifications');
      return { page: { pageNumber: 1, size: PAGE_SIZE, totalElements: 0, selected: [], indexPaging: null }, data: [] };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { page, data } = lastPage;
      if (!data || data.length < PAGE_SIZE) return undefined;
      return (page?.pageNumber ?? 1) + 1;
    },
    initialPageParam: 1,
  });
}

export function useAddMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: MuteSettingDto) => notificationSettingsService.addMute(dto),
    onSuccess: (res, variables) => {
      if (res.result) {
        // Invalidate mutes list to refetch
        queryClient.invalidateQueries({ queryKey: ['notification-settings', 'mutes'] });

        // Update IsMuted flag in notification caches
        updateMuteStatusInCache(
          queryClient,
          variables.EntityType,
          variables.EntityId,
          variables.Type,
          true
        );
        toast.success('Notification muted');
      } else {
        toast.error(res.message || 'Failed to mute notification');
      }
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
    onSuccess: (res, variables) => {
      if (res.result) {
        // Invalidate mutes list to refetch
        queryClient.invalidateQueries({ queryKey: ['notification-settings', 'mutes'] });

        // Update IsMuted flag in notification caches
        updateMuteStatusInCache(
          queryClient,
          variables.EntityType,
          variables.EntityId,
          variables.Type,
          false
        );
        toast.success('Notification unmuted');
      } else {
        toast.error(res.message || 'Failed to unmute notification');
      }
    },
    onError: () => {
      toast.error('Failed to unmute notification');
    },
  });
}
