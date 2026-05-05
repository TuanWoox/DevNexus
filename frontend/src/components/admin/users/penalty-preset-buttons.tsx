'use client';

import { AdminProfileDTO } from '@/types/admin/admin-profile-dto';
import {
  useTimeout7Days,
  useTimeout30Days,
  useBanUser,
} from '@/hooks/admin/use-user-penalty-presets';

interface PenaltyPresetButtonsProps {
  user: AdminProfileDTO;
}

export function PenaltyPresetButtons({ user }: PenaltyPresetButtonsProps) {
  const timeout7 = useTimeout7Days();
  const timeout30 = useTimeout30Days();
  const ban = useBanUser();

  const anyPending = timeout7.isPending || timeout30.isPending || ban.isPending;

  return (
    <div className="flex flex-col gap-1">
      <button
        className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors text-left"
        disabled={anyPending}
        onClick={() => timeout7.mutate(user.id)}
      >
        Apply 7-Day Timeout
      </button>
      <button
        className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 hover:bg-orange-200 disabled:opacity-50 transition-colors text-left"
        disabled={anyPending}
        onClick={() => timeout30.mutate(user.id)}
      >
        Apply 30-Day Timeout
      </button>
      <button
        className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 transition-colors text-left"
        disabled={anyPending}
        onClick={() => ban.mutate(user.id)}
      >
        Permanently Ban User
      </button>
    </div>
  );
}
