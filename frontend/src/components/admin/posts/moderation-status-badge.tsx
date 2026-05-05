import { ModerationStatus } from '@/types/admin/admin-post-dto';

const statusClasses: Record<ModerationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Flagged: 'bg-red-100 text-red-800',
  InReview: 'bg-orange-100 text-orange-800',
};

interface ModerationStatusBadgeProps {
  status: ModerationStatus;
}

export function ModerationStatusBadge({ status }: ModerationStatusBadgeProps) {
  const classes = statusClasses[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}
