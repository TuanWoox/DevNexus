import { BarChart3 } from 'lucide-react'

interface ContentDistributionProps {
  totalPosts: number
  approvedPosts: number
  pendingPosts: number
  inReviewPosts: number
  flaggedPosts: number
  rejectedPosts: number
  totalQuestionPosts: number
  totalNormalPosts: number
}

interface DistributionRow {
  label: string
  value: number
  total: number
  barClass: string
  badgeClass: string
}

function DistributionBar({ row }: { row: DistributionRow }) {
  const pct = row.total > 0 ? Math.min(Math.round((row.value / row.total) * 100), 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-body">{row.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-heading tabular-nums">
            {row.value.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${row.barClass} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function DashboardContentDistribution({
  totalPosts,
  approvedPosts,
  pendingPosts,
  inReviewPosts,
  flaggedPosts,
  rejectedPosts,
  totalQuestionPosts,
  totalNormalPosts,
}: ContentDistributionProps) {
  const statusRows: DistributionRow[] = [
    {
      label: 'Approved',
      value: approvedPosts,
      total: totalPosts,
      barClass: 'bg-emerald-500',
      badgeClass: 'badge-emerald',
    },
    {
      label: 'Pending',
      value: pendingPosts,
      total: totalPosts,
      barClass: 'bg-amber-400',
      badgeClass: 'badge-amber',
    },
    {
      label: 'In Review',
      value: inReviewPosts,
      total: totalPosts,
      barClass: 'bg-blue-400',
      badgeClass: 'badge-default',
    },
    {
      label: 'Flagged',
      value: flaggedPosts,
      total: totalPosts,
      barClass: 'bg-orange-400',
      badgeClass: 'badge-amber',
    },
    {
      label: 'Rejected',
      value: rejectedPosts,
      total: totalPosts,
      barClass: 'bg-red-500',
      badgeClass: 'badge-red',
    },
  ]

  const typeRows: DistributionRow[] = [
    {
      label: 'Blog Posts',
      value: totalNormalPosts,
      total: totalPosts,
      barClass: 'bg-primary/70',
      badgeClass: 'badge-default',
    },
    {
      label: 'Q&A Posts',
      value: totalQuestionPosts,
      total: totalPosts,
      barClass: 'bg-cyan-500/70',
      badgeClass: 'badge-cyan',
    },
  ]

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
          Content Breakdown
        </h3>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Moderation Status
          </p>
          <div className="flex flex-col gap-3">
            {statusRows.map((row) => (
              <DistributionBar key={row.label} row={row} />
            ))}
          </div>
        </div>

        <div className="border-t border-default" />

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Post Type
          </p>
          <div className="flex flex-col gap-3">
            {typeRows.map((row) => (
              <DistributionBar key={row.label} row={row} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-auto">
        Based on {totalPosts.toLocaleString()} total posts
      </p>
    </div>
  )
}
