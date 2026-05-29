import { ModerationStatus } from '@/types/admin/admin-post-dto';

const stringMap: Record<string, { label: string; className: string }> = {
  Pending: { label: 'Pending', className: 'badge-cyan' },
  Approved: { label: 'Approved', className: 'badge-emerald' },
  Flagged: { label: 'Flagged', className: 'badge-red' },
  InReview: { label: 'In Review', className: 'badge-amber' },
};

const numericMap: Record<number, { label: string; className: string }> = {
  0: { label: 'Pending', className: 'badge-cyan' },
  1: { label: 'Approved', className: 'badge-emerald' },
  2: { label: 'Flagged', className: 'badge-red' },
  3: { label: 'In Review', className: 'badge-amber' },
};

interface ModerationStatusBadgeProps {
  status: ModerationStatus | number;
}

export function ModerationStatusBadge({ status }: ModerationStatusBadgeProps) {
  const resolved = typeof status === 'number' ? numericMap[status] : stringMap[status as string];
  const label = resolved?.label ?? String(status);
  const className = resolved?.className ?? 'badge-default';
  return <span className={className}>{label}</span>;
}
