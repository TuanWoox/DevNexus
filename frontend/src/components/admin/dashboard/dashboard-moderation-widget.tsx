'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminModerationService } from '@/services/admin-moderation-service'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { adminQueryKeys } from '@/hooks/admin/admin-query-keys'
import { CheckCircle2, XCircle, ExternalLink, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardModerationWidgetProps {
  entries: AdminQueueEntryDTO[]
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

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-lg transition-opacity',
        resolved ? 'opacity-40 pointer-events-none' : 'bg-subtle',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading truncate leading-tight">
          {entry.postTitle || 'Untitled Post'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground truncate">
            {new Date(entry.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => approve.mutate()}
          disabled={isPending || resolved}
          title="Approve"
          className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => reject.mutate()}
          disabled={isPending || resolved}
          title="Reject"
          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
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
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        <p className="text-sm text-muted-foreground">Queue is clear</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <QueueRow key={e.id} entry={e} />
        ))}
      </ul>
      <Link
        href="/admin/moderation"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 self-end"
      >
        View full queue <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  )
}
