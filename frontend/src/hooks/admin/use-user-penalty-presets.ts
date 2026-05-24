import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { adminUsersService } from '@/services/admin-users-service';

const invalidateUsers = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: adminQueryKeys.users.all });
  queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
};

export const useTimeout7Days = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminUsersService.timeout7Days(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success('7-day timeout applied');
    },
  });
};

export const useTimeout30Days = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminUsersService.timeout30Days(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success('30-day timeout applied');
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminUsersService.ban(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success('User permanently banned');
    },
  });
};
