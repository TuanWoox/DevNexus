'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminModerationService } from '@/services/admin-moderation-service'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { adminQueryKeys } from '@/hooks/admin/admin-query-keys'
import { CheckCircle2, XCircle, ExternalLink, Clock, User, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardModerationWidgetProps {
  entries: AdminQueueEntryDTO[]
}

function getRiskBadge(score: number) {
  if (score >= 0.75) return { label: 'High risk', className: 'badge-red' }
  if (score >= 0.45) return { label: 'Med risk', className: 'badge-amber' }
  return { label: 'Low risk', className: 'badge-default' }
}

function QueueRow({ entry }: { entry: AdminQueueEntryDTO }) {
  const queryClient = useQueryClient()
  const [resolved, setResolved] = useState(false)

  const approve = useMutation({
    mutationFn: () =>
      adminModerationService.approve({ id: entry.id, resolution: 'Approved' }),
    onSuccess: () => {
      setResolved(true)
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() })
    },
  })

  const reject = useMutation({
    mutationFn: () =>
      adminModerationService.reject({ id: entry.id, resolution: 'Rejected' }),
    onSuccess: () => {
      setResolved(true)
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() })
    },
  })

  const isPending = approve.isPending || reject.isPending
  const riskScore = entry.tier1Score ?? 0
  const risk = getRiskBadge(riskScore)

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 rounded-xl border border-default transition-opacity',
        resolved ? 'opacity-40 pointer-events-none' : 'bg-subtle hover:border-slate-300 dark:hover:border-slate-600',
      )}
    >
      <div className="flex-1 min-w-0">
        {/* Title + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-heading truncate leading-tight flex-1 min-w-0">
            {entry.postTitle || 'Untitled Post'}
          </p>
          {entry.entityType && (
            <span className="badge-default text-[10px] shrink-0">{entry.entityType}</span>
          )}
          <span className={cn('text-[10px] shrink-0', risk.className)}>{risk.label}</span>
        </div>

        {/* Author + date row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {entry.author?.fullName && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {entry.author.fullName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Reason snippet */}
        {entry.reason && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
            &ldquo;{entry.reason}&rdquo;
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0 self-center">
        <button
          onClick={() => approve.mutate()}
          disabled={isPending || resolved}
          title="Approve"
          aria-label="Approve post"
          className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => reject.mutate()}
          disabled={isPending || resolved}
          title="Reject"
          aria-label="Reject post"
          className="p-2 rounded-lg text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </li>
  )
}

export function DashboardModerationWidget({
  entries,
}: DashboardModerationWidgetProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <p className="text-sm font-medium text-heading">Queue is clear</p>
        <p className="text-xs text-muted-foreground">All posts have been reviewed</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <QueueRow key={e.id} entry={e} />
        ))}
      </ul>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Showing top {entries.length} items</span>
        </div>
        <Link
          href="/admin/moderation"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
        >
          View full queue <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
