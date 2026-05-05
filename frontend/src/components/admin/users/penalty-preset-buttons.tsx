'use client';

import { AdminProfileDTO } from '@/types/admin/admin-profile-dto';
import { Button } from '@/components/ui/button';
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
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="justify-start badge-amber border-0"
        disabled={anyPending}
        onClick={() => timeout7.mutate(user.id)}
      >
        Apply 7-Day Timeout
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="justify-start badge-amber border-0"
        disabled={anyPending}
        onClick={() => timeout30.mutate(user.id)}
      >
        Apply 30-Day Timeout
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="justify-start badge-red border-0"
        disabled={anyPending}
        onClick={() => ban.mutate(user.id)}
      >
        Permanently Ban User
      </Button>
    </div>
  );
}
