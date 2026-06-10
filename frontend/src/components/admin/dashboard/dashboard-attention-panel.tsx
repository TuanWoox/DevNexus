import Link from 'next/link'
import { AlertTriangle, Clock, Flag, Zap, CheckCircle2 } from 'lucide-react'

interface AttentionItem {
  label: string
  value: number
  icon: React.ReactNode
  href: string
  color: 'amber' | 'red' | 'blue' | 'default'
}

interface DashboardAttentionPanelProps {
  queueEntries: number
  inReviewPosts: number
  flaggedPosts: number
  pendingReports: number
}

const colorMap = {
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/20',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  default: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-700 dark:text-slate-300',
  },
}

function AttentionTile({ item }: { item: AttentionItem }) {
  const c = colorMap[item.color]
  return (
    <Link
      href={item.href}
      className={`flex flex-col gap-2 p-4 rounded-xl border ${c.bg} ${c.border} transition-all duration-150 hover:scale-[1.02] hover:shadow-card cursor-pointer`}
    >
      <div className={`${c.icon}`}>{item.icon}</div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${c.value}`}>
          {item.value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{item.label}</p>
      </div>
    </Link>
  )
}

export function DashboardAttentionPanel({
  queueEntries,
  inReviewPosts,
  flaggedPosts,
  pendingReports,
}: DashboardAttentionPanelProps) {
  const totalUrgent = queueEntries + inReviewPosts + flaggedPosts + pendingReports

  const items: AttentionItem[] = [
    {
      label: 'Pending Review',
      value: queueEntries,
      icon: <Clock className="w-5 h-5" />,
      href: '/admin/moderation',
      color: queueEntries > 0 ? 'amber' : 'default',
    },
    {
      label: 'In Review',
      value: inReviewPosts,
      icon: <AlertTriangle className="w-5 h-5" />,
      href: '/admin/review-queue',
      color: inReviewPosts > 0 ? 'blue' : 'default',
    },
    {
      label: 'Flagged Content',
      value: flaggedPosts,
      icon: <Zap className="w-5 h-5" />,
      href: '/admin/review-queue',
      color: flaggedPosts > 0 ? 'red' : 'default',
    },
    {
      label: 'Open Reports',
      value: pendingReports,
      icon: <Flag className="w-5 h-5" />,
      href: '/admin/reports',
      color: pendingReports > 0 ? 'red' : 'default',
    },
  ]

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
            Admin Attention
          </h3>
        </div>
        {totalUrgent === 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All clear
          </span>
        )}
        {totalUrgent > 0 && (
          <span className="badge-amber text-xs">
            {totalUrgent} item{totalUrgent !== 1 ? 's' : ''} need attention
          </span>
        )}
      </div>

      {totalUrgent === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <p className="text-sm font-medium text-heading">No urgent issues</p>
          <p className="text-xs text-muted-foreground">Platform is operating normally</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <AttentionTile key={item.label} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
