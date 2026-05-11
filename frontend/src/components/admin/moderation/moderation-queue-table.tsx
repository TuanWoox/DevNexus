'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, MoreHorizontal, CheckCircle2, XCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { ModerationResolveDialog } from './moderation-resolve-dialog'
import { PostDetailSheet } from './post-detail-sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TabValue = 'all' | 'pending' | 'approved' | 'flagged'

interface ModerationQueueTableProps {
  entries: AdminQueueEntryDTO[]
  isLoading: boolean
  onApprove: (entry: AdminQueueEntryDTO, note?: string) => void
  onReject: (entry: AdminQueueEntryDTO, note?: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Tier1ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono',
        score >= 0.8
          ? 'bg-red-500/10 text-red-600 border border-red-500/30'
          : score >= 0.5
          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
      )}
    >
      <Sparkles className="w-3 h-3" />
      {score.toFixed(2)}
    </span>
  )
}

function ResolutionBadge({ resolution }: { resolution?: string }) {
  if (!resolution) {
    return <span className="badge-amber">Pending</span>
  }
  if (resolution === 'Approved') {
    return <span className="badge-emerald">Approved</span>
  }
  return <span className="badge-red">Rejected</span>
}

function AuthorCell({ authorId }: { authorId: string }) {
  const initials = authorId.slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-primary">{initials}</span>
      </div>
      <span className="font-mono text-xs text-muted-foreground truncate max-w-[100px]">
        {authorId}
      </span>
    </div>
  )
}

function getTabCount(entries: AdminQueueEntryDTO[], tab: TabValue): number {
  if (tab === 'all') return entries.length
  if (tab === 'pending') return entries.filter((e) => !e.resolution).length
  if (tab === 'approved') return entries.filter((e) => e.resolution === 'Approved').length
  return 0
}

function filterByTab(entries: AdminQueueEntryDTO[], tab: TabValue): AdminQueueEntryDTO[] {
  if (tab === 'all') return entries
  if (tab === 'pending') return entries.filter((e) => !e.resolution)
  if (tab === 'approved') return entries.filter((e) => e.resolution === 'Approved')
  return entries
}

export function ModerationQueueTable({
  entries,
  isLoading,
  onApprove,
  onReject,
}: ModerationQueueTableProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [sheetState, setSheetState] = useState<{
    open: boolean
    entry: AdminQueueEntryDTO | null
  }>({ open: false, entry: null })
  const [dialogState, setDialogState] = useState<{
    open: boolean
    entry: AdminQueueEntryDTO | null
    action: 'approve' | 'reject'
  }>({ open: false, entry: null, action: 'approve' })

  function openSheet(entry: AdminQueueEntryDTO) {
    setSheetState({ open: true, entry })
  }

  function closeSheet() {
    setSheetState((prev) => ({ ...prev, open: false }))
  }

  function openDialog(entry: AdminQueueEntryDTO, action: 'approve' | 'reject') {
    setDialogState({ open: true, entry, action })
  }

  function closeDialog() {
    setDialogState((prev) => ({ ...prev, open: false }))
  }

  function handleConfirm(note?: string) {
    if (!dialogState.entry) return
    if (dialogState.action === 'approve') {
      onApprove(dialogState.entry, note)
    } else {
      onReject(dialogState.entry, note)
    }
    closeDialog()
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id).catch(() => {})
  }

  const filtered = filterByTab(entries, activeTab)

  return (
    <>
      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          No entries in this category.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Post Title
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Score
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0 hover:bg-subtle transition-colors"
                >
                  <td className="px-4 py-3 max-w-[260px]">
                    <button
                      type="button"
                      className="text-left truncate text-foreground/85 cursor-pointer hover:underline hover:text-primary transition-colors font-medium"
                      onClick={() => openSheet(entry)}
                    >
                      {entry.postTitle || 'Untitled Post'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <AuthorCell authorId={entry.authorId} />
                  </td>
                  <td className="px-4 py-3">
                    <ResolutionBadge resolution={entry.resolution} />
                  </td>
                  <td className="px-4 py-3">
                    <Tier1ScoreBadge score={entry.tier1Score} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSheet(entry)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDialog(entry, 'approve')}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Quick Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => openDialog(entry, 'reject')}
                          >
                            <XCircle className="w-4 h-4" />
                            Quick Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyId(entry.postId)}>
                            <Copy className="w-4 h-4" />
                            Copy Post ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Detail Sheet */}
      {sheetState.entry && (
        <PostDetailSheet
          open={sheetState.open}
          onClose={closeSheet}
          entry={sheetState.entry}
          onApprove={(e) => openDialog(e, 'approve')}
          onReject={(e) => openDialog(e, 'reject')}
        />
      )}

      {/* Confirm Dialog */}
      {dialogState.entry && (
        <ModerationResolveDialog
          open={dialogState.open}
          onClose={closeDialog}
          entry={dialogState.entry}
          action={dialogState.action}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
