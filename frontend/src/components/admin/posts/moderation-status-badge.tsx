import { ModerationStatus } from '@/types/admin/admin-post-dto';

const statusClasses: Record<ModerationStatus, string> = {
  Pending: 'badge-amber',
  Approved: 'badge-emerald',
  Flagged: 'badge-red',
  InReview: 'badge-default',
};

interface ModerationStatusBadgeProps {
  status: ModerationStatus;
}

export function ModerationStatusBadge({ status }: ModerationStatusBadgeProps) {
  const classes = statusClasses[status] ?? 'badge-default';
  return (
    <span className={classes}>
      {status}
    </span>
  );
}
