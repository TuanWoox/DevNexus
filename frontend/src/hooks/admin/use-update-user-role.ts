import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from './admin-query-keys';
import { adminUsersService } from '@/services/admin-users-service';
import { AdminUpdateRoleDTO } from '@/types/admin/admin-profile-dto';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AdminUpdateRoleDTO }) =>
      adminUsersService.updateRole(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
      toast.success('Role updated');
    },
  });
};
