'use client'

import { MarkdownViewer } from '@/components/editor/markdown-viewer'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Calendar,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

interface QueueDetailSheetProps {
  open: boolean
  onClose: () => void
  entry: AdminQueueEntryDTO
  onApprove: (entry: AdminQueueEntryDTO) => void
  onReject: (entry: AdminQueueEntryDTO) => void
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Tier1ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-mono',
        score >= 0.8
          ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          : score >= 0.5
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      )}
    >
      <Sparkles className="h-3 w-3" />
      {score.toFixed(2)}
    </span>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  ai = false,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  action?: ReactNode
  ai?: boolean
}) {
  return (
    <section className={cn('card overflow-hidden', ai && 'border-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.08)]')}>
      <div className={cn('flex items-center justify-between gap-3 border-b border-border px-4 py-3', ai ? 'bg-emerald-500/5' : 'bg-muted/30')}>
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', ai ? 'text-emerald-500' : 'text-primary')} />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-heading">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm text-foreground/85">{children}</div>
    </div>
  )
}

function getTargetId(entry: AdminQueueEntryDTO): string {
  return entry.targetId ?? entry.postId ?? ''
}

function getEntityLabel(entry: AdminQueueEntryDTO): string {
  if (entry.entityType) return entry.entityType
  if (entry.targetType === 1 || entry.targetType === 'Answer') return 'Answer'
  if (entry.targetType === 2 || entry.targetType === 'Comment') return 'Comment'
  return 'Post'
}

export function QueueDetailSheet({
  open,
  onClose,
  entry,
  onApprove,
  onReject,
}: QueueDetailSheetProps) {
  const authorName = entry.author?.fullName ?? entry.authorId
  const entityLabel = getEntityLabel(entry)
  const targetId = getTargetId(entry)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex !w-[min(92vw,980px)] !max-w-none flex-col overflow-hidden p-0 sm:!max-w-none">
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <SheetHeader className="border-b border-border bg-card px-6 py-5">
            <div className="space-y-4 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-cyan whitespace-nowrap">Needs Review</span>
                <span className="badge-default whitespace-nowrap">{entityLabel}</span>
                <Tier1ScoreBadge score={entry.tier1Score} />
              </div>

              <div className="space-y-2">
                <SheetTitle className="text-balance text-2xl font-bold leading-tight text-heading">
                  {entry.postTitle || entityLabel}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate font-mono text-foreground/80">{authorName}</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5 px-6 py-5">
            <SectionCard title="Queue Identity" icon={ShieldAlert}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Author">
                  <span className="block truncate font-mono">{authorName}</span>
                </InfoRow>
                <InfoRow label="Submitted">
                  <span>{formatDate(entry.createdAt)}</span>
                </InfoRow>
                <InfoRow label="Content type">
                  <span className="badge-default whitespace-nowrap">{entityLabel}</span>
                </InfoRow>
                <InfoRow label="Target ID">
                  <span className="block truncate font-mono text-xs">{targetId}</span>
                </InfoRow>
                <InfoRow label="Queue ID">
                  <span className="block truncate font-mono text-xs">{entry.id}</span>
                </InfoRow>
              </div>
            </SectionCard>

            <SectionCard
              title="AI Moderation Analysis"
              icon={Sparkles}
              action={<Tier1ScoreBadge score={entry.tier1Score} />}
              ai
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Flagged Reason</p>
                  <p className="text-sm leading-relaxed text-foreground/85">{entry.reason || 'No reason provided'}</p>
                </div>
                {entry.tier2Reasoning && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Reasoning</p>
                    <p className="text-sm leading-relaxed text-foreground/85">{entry.tier2Reasoning}</p>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Content Preview" icon={FileText}>
              {entry.postContent ? (
                <MarkdownViewer source={entry.postContent} />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm text-muted-foreground">Content preview unavailable</p>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button onClick={onClose} className="btn-ghost sm:min-w-28">
              Close
            </button>
            <button
              onClick={() => {
                onReject(entry)
                onClose()
              }}
              className="btn-danger sm:min-w-32"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => {
                onApprove(entry)
                onClose()
              }}
              className="btn-emerald sm:min-w-32"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
