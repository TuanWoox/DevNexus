'use client'

import { useGetPostById } from '@/hooks/post-hooks/use-get-post-by-id'
import { MarkdownViewer } from '@/components/editor/markdown-viewer'
import { AdminPostDTO } from '@/types/admin/admin-post-dto'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileCode2,
  FileText,
  Hash,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { ModerationStatusBadge } from './moderation-status-badge'

interface ContentDetailSheetProps {
  open: boolean
  onClose: () => void
  post: AdminPostDTO
  onApprove: (post: AdminPostDTO) => void
  onReject: (post: AdminPostDTO) => void
}

function mapPostType(type: string | number): string {
  if (typeof type === 'number') {
    return type === 0 ? 'Markdown' : type === 1 ? 'WYSIWYG' : 'Unknown'
  }
  return type === 'MarkDown' ? 'Markdown' : type === 'WYSIWYG' ? 'WYSIWYG' : String(type)
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

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value).catch(() => {})
}

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
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

export function ContentDetailSheet({
  open,
  onClose,
  post,
  onApprove,
  onReject,
}: ContentDetailSheetProps) {
  const { data: fullPost, isLoading } = useGetPostById(post.id, open)
  const authorName = post.author?.fullName ?? post.authorId
  const score = post.upvoteCount - post.downvoteCount

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex !w-[min(92vw,980px)] !max-w-none flex-col overflow-hidden p-0 sm:!max-w-none">
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <SheetHeader className="border-b border-border bg-card px-6 py-5">
            <div className="space-y-4 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <ModerationStatusBadge status={post.moderationStatus} />
                <span className="badge-default whitespace-nowrap">{post.entityType}</span>
                <span className="badge-purple whitespace-nowrap font-mono">{mapPostType(post.postType)}</span>
              </div>

              <div className="space-y-2">
                <SheetTitle className="text-balance text-2xl font-bold leading-tight text-heading">
                  {post.title || 'Untitled'}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate font-mono text-foreground/80">{authorName}</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {formatDate(post.dateCreated)}
                    </span>
                  </div>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5 px-6 py-5">
            <SectionCard title="Identity" icon={FileCode2}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Author">
                  <span className="block truncate font-mono">{authorName}</span>
                </InfoRow>
                <InfoRow label="Created">
                  <span>{formatDate(post.dateCreated)}</span>
                </InfoRow>
                <InfoRow label="Content type">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge-default whitespace-nowrap">{post.entityType}</span>
                    <span className="badge-purple whitespace-nowrap font-mono">{mapPostType(post.postType)}</span>
                  </div>
                </InfoRow>
                <InfoRow label="ID">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(post.id)}
                    className="inline-flex max-w-full items-center gap-2 font-mono text-xs text-primary hover:underline"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{post.id}</span>
                  </button>
                </InfoRow>
              </div>
            </SectionCard>

            <SectionCard title="Moderation & Engagement" icon={ShieldAlert}>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoRow label="Status">
                  <ModerationStatusBadge status={post.moderationStatus} />
                </InfoRow>
                <InfoRow label="Votes">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {post.upvoteCount}
                    </span>
                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {post.downvoteCount}
                    </span>
                  </div>
                </InfoRow>
                <InfoRow label="Score">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-heading">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    {score > 0 ? `+${score}` : score}
                  </span>
                </InfoRow>
              </div>
            </SectionCard>

            <SectionCard
              title="Content Body"
              icon={FileText}
              action={
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDate(post.dateModified ?? post.dateCreated)}
                </div>
              }
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ) : fullPost ? (
                <MarkdownViewer
                  source={fullPost.content}
                  enableCodeTools
                  context="post-detail"
                  postId={post.id}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm text-muted-foreground">Content preview unavailable</p>
                </div>
              )}
            </SectionCard>

            {post.slug && (
              <button
                type="button"
                onClick={() => copyToClipboard(post.slug!)}
                className="btn-ghost w-full justify-start"
              >
                <ExternalLink className="h-4 w-4" />
                Copy slug
              </button>
            )}
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button onClick={onClose} className="btn-ghost sm:min-w-28">
              Close
            </button>
            {post.moderationStatus !== 'Flagged' && post.moderationStatus !== 2 && (
              <button
                onClick={() => {
                  onReject(post)
                  onClose()
                }}
                className="btn-danger sm:min-w-36"
              >
                <XCircle className="h-4 w-4" />
                Force Reject
              </button>
            )}
            {post.moderationStatus !== 'Approved' && post.moderationStatus !== 1 && (
              <button
                onClick={() => {
                  onApprove(post)
                  onClose()
                }}
                className="btn-emerald sm:min-w-36"
              >
                <CheckCircle2 className="h-4 w-4" />
                Force Approve
              </button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
