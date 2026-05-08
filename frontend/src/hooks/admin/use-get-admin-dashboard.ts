import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './admin-query-keys';
import { adminDashboardService } from '@/services/admin-dashboard-service';

export const useGetAdminDashboard = () => {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: () => adminDashboardService.getDashboard(),
  });
};
