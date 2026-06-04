'use client'

import { useState } from 'react'
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { AdminPostDTO, ModerationStatus } from '@/types/admin/admin-post-dto'
import { ModerationResolveDialog } from '../moderation/moderation-resolve-dialog'
import { PostDetailSheet } from '../moderation/post-detail-sheet'
import { PostOverviewSheet } from './post-overview-sheet'
import { AdminPostActionDialog } from './admin-post-action-dialog'
import { ModerationStatusBadge } from './moderation-status-badge'
import { PostsRiskBadge, getRiskLevelForScore } from './posts-risk-badge'
import { PostsTableSkeleton } from './posts-table-skeleton'
import { PostsEmptyState } from './posts-empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TabValue = 'needs-review' | 'published' | 'flagged' | 'all'

interface UnifiedPostsTableProps {
  queueEntries: AdminQueueEntryDTO[]
  allPosts: AdminPostDTO[]
  tabCounts: Record<TabValue, number>
  isLoading: boolean
  activeTab: TabValue
  hasActiveFilters: boolean
  onClearFilters: () => void
  onApproveQueue: (entry: AdminQueueEntryDTO, note?: string) => void
  onRejectQueue: (entry: AdminQueueEntryDTO, note?: string) => void
  onApprovePost: (post: AdminPostDTO) => void
  onRejectPost: (post: AdminPostDTO, reasonText: string, moderatorNote?: string) => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function mapEntityTypeLabel(raw: string): string {
  if (!raw) return 'Post'
  if (raw.toLowerCase().includes('qa') || raw.toLowerCase().includes('question')) return 'Q&A'
  return 'Post'
}

// ─── Author Cell ─────────────────────────────────────────────────────────────

function AuthorCell({ author }: { author?: { fullName: string; id: string } }) {
  if (!author) return <span className="text-xs text-muted-foreground">—</span>
  const initials = getInitials(author.fullName)
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
        <span className="text-[10px] font-bold text-primary leading-none">{initials}</span>
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[110px] font-medium">
        {author.fullName}
      </span>
    </div>
  )
}

// ─── Content Cell ─────────────────────────────────────────────────────────────

function ContentCell({
  title,
  excerpt,
  entityType,
  onClick,
}: {
  title: string
  excerpt?: string
  entityType?: string
  onClick: () => void
}) {
  const entityLabel = entityType ? mapEntityTypeLabel(entityType) : null
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="text-left text-sm font-semibold text-heading hover:text-primary transition-colors truncate block"
      >
        {title || 'Untitled Post'}
      </button>
      {excerpt && (
        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{excerpt}</p>
      )}
      {entityLabel && (
        <span className="badge-default font-mono text-[10px] self-start mt-0.5">{entityLabel}</span>
      )}
    </div>
  )
}

// ─── Votes Cell ──────────────────────────────────────────────────────────────

function VotesCell({ up, down }: { up: number; down: number }) {
  return (
    <div className="flex flex-col gap-0.5 text-[11px] font-mono">
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <ThumbsUp className="w-3 h-3" />
        {up}
      </span>
      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
        <ThumbsDown className="w-3 h-3" />
        {down}
      </span>
    </div>
  )
}

// ─── Unified Row Type ─────────────────────────────────────────────────────────

type UnifiedRow = {
  type: 'queue' | 'post'
  queueEntry?: AdminQueueEntryDTO
  post?: AdminPostDTO
}

function buildUnifiedRows(
  queueEntries: AdminQueueEntryDTO[],
  allPosts: AdminPostDTO[],
  activeTab: TabValue,
): UnifiedRow[] {
  if (activeTab === 'needs-review') {
    return queueEntries
      .filter((e) => !e.resolution)
      .map((e) => ({ type: 'queue' as const, queueEntry: e }))
  }
  return allPosts.map((p) => ({ type: 'post' as const, post: p }))
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UnifiedPostsTable({
  queueEntries,
  allPosts,
  isLoading,
  activeTab,
  hasActiveFilters,
  onClearFilters,
  onApproveQueue,
  onRejectQueue,
  onApprovePost,
  onRejectPost,
}: UnifiedPostsTableProps) {
  // Sheet states
  const [queueSheetState, setQueueSheetState] = useState<{
    open: boolean
    entry: AdminQueueEntryDTO | null
  }>({ open: false, entry: null })

  const [postSheetState, setPostSheetState] = useState<{
    open: boolean
    post: AdminPostDTO | null
  }>({ open: false, post: null })

  // Dialog states
  const [queueDialogState, setQueueDialogState] = useState<{
    open: boolean
    entry: AdminQueueEntryDTO | null
    action: 'approve' | 'reject'
  }>({ open: false, entry: null, action: 'approve' })

  const [postDialogState, setPostDialogState] = useState<{
    open: boolean
    post: AdminPostDTO | null
    action: 'approve' | 'reject'
  }>({ open: false, post: null, action: 'approve' })

  const rows = buildUnifiedRows(queueEntries, allPosts, activeTab)
  const showRisk = activeTab === 'needs-review' || activeTab === 'all'
  const showVotes = activeTab === 'published' || activeTab === 'all'

  if (isLoading) {
    return <PostsTableSkeleton rows={6} showRisk={showRisk} />
  }

  if (rows.length === 0) {
    return (
      <PostsEmptyState hasFilters={hasActiveFilters} onClearFilters={onClearFilters} />
    )
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Content
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium w-40">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium w-28">
                  Status
                </th>
                {showRisk && (
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium w-24">
                    AI Risk
                  </th>
                )}
                {showVotes && (
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium w-20">
                    Votes
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium w-28">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wider font-medium w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => {
                const isQueue = row.type === 'queue'
                const entry = row.queueEntry
                const post = row.post

                const title = isQueue ? entry!.postTitle : post!.title
                const excerpt = isQueue
                  ? entry!.postContent?.slice(0, 120)
                  : post!.contentPreview ?? undefined
                const author = isQueue
                  ? entry!.author
                    ? { fullName: entry!.author.fullName, id: entry!.author.id }
                    : undefined
                  : post!.author
                  ? { fullName: post!.author.fullName, id: post!.author.id }
                  : undefined
                const entityType = isQueue ? entry!.entityType : post!.entityType
                const aiScore = isQueue ? entry!.tier1Score : undefined
                const votes = !isQueue ? { up: post!.upvoteCount, down: post!.downvoteCount } : undefined
                const created = isQueue ? entry!.createdAt : post!.dateCreated

                // Row accent logic
                const isFlagged =
                  !isQueue &&
                  (post!.moderationStatus === 'Flagged' || post!.moderationStatus === 2)
                const isHighRisk = aiScore !== undefined && getRiskLevelForScore(aiScore) === 'high'

                function openDetail() {
                  if (isQueue) {
                    setQueueSheetState({ open: true, entry: entry! })
                  } else {
                    setPostSheetState({ open: true, post: post! })
                  }
                }

                return (
                  <tr
                    key={`${row.type}-${idx}`}
                    className={cn(
                      'transition-colors group',
                      isFlagged && 'border-l-2 border-l-red-400/60',
                      isHighRisk && !isFlagged && 'bg-red-50/30 dark:bg-red-950/15',
                      'hover:bg-muted/40',
                    )}
                  >
                    {/* Content */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <ContentCell
                        title={title}
                        excerpt={excerpt}
                        entityType={entityType}
                        onClick={openDetail}
                      />
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3.5 w-40">
                      <AuthorCell author={author} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 w-28">
                      {isQueue ? (
                        <span className="badge-amber">In Review</span>
                      ) : (
                        <ModerationStatusBadge status={post!.moderationStatus} />
                      )}
                    </td>

                    {/* AI Risk */}
                    {showRisk && (
                      <td className="px-4 py-3.5 w-24">
                        {aiScore !== undefined ? (
                          <PostsRiskBadge score={aiScore} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )}

                    {/* Votes */}
                    {showVotes && (
                      <td className="px-4 py-3.5 w-20">
                        {votes ? <VotesCell up={votes.up} down={votes.down} /> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    )}

                    {/* Date */}
                    <td className="px-4 py-3.5 w-28 whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(created)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 w-24">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick approve/reject for queue entries */}
                        {isQueue && (
                          <>
                            <button
                              type="button"
                              title="Quick Approve"
                              aria-label="Quick Approve"
                              onClick={() =>
                                setQueueDialogState({ open: true, entry: entry!, action: 'approve' })
                              }
                              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Quick Reject"
                              aria-label="Quick Reject"
                              onClick={() =>
                                setQueueDialogState({ open: true, entry: entry!, action: 'reject' })
                              }
                              className="p-1.5 rounded-md text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={openDetail}>
                              <Eye className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {isQueue ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setQueueDialogState({ open: true, entry: entry!, action: 'approve' })
                                  }
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    setQueueDialogState({ open: true, entry: entry!, action: 'reject' })
                                  }
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {post!.moderationStatus !== 'Approved' &&
                                  post!.moderationStatus !== 1 && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPostDialogState({ open: true, post: post!, action: 'approve' })
                                      }
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      Force Approve
                                    </DropdownMenuItem>
                                  )}
                                {post!.moderationStatus !== 'Flagged' &&
                                  post!.moderationStatus !== 2 && (
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() =>
                                        setPostDialogState({ open: true, post: post!, action: 'reject' })
                                      }
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Force Reject
                                    </DropdownMenuItem>
                                  )}
                              </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const id = isQueue ? entry!.postId : post!.id
                                navigator.clipboard.writeText(id).catch(() => {})
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Copy Post ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Queue Entry Sheet */}
      {queueSheetState.entry && (
        <PostDetailSheet
          open={queueSheetState.open}
          onClose={() => setQueueSheetState((s) => ({ ...s, open: false }))}
          entry={queueSheetState.entry}
          onApprove={(e) => setQueueDialogState({ open: true, entry: e, action: 'approve' })}
          onReject={(e) => setQueueDialogState({ open: true, entry: e, action: 'reject' })}
        />
      )}

      {/* Post Sheet */}
      {postSheetState.post && (
        <PostOverviewSheet
          open={postSheetState.open}
          onClose={() => setPostSheetState((s) => ({ ...s, open: false }))}
          post={postSheetState.post}
          onApprove={(p) => setPostDialogState({ open: true, post: p, action: 'approve' })}
          onReject={(p) => setPostDialogState({ open: true, post: p, action: 'reject' })}
        />
      )}

      {/* Queue Dialog */}
      {queueDialogState.entry && (
        <ModerationResolveDialog
          open={queueDialogState.open}
          onClose={() => setQueueDialogState((s) => ({ ...s, open: false }))}
          entry={queueDialogState.entry}
          action={queueDialogState.action}
          onConfirm={(note) => {
            if (queueDialogState.action === 'approve') {
              onApproveQueue(queueDialogState.entry!, note)
            } else {
              onRejectQueue(queueDialogState.entry!, note)
            }
            setQueueDialogState((s) => ({ ...s, open: false }))
          }}
        />
      )}

      {/* Post Dialog */}
      {postDialogState.post && (
        <AdminPostActionDialog
          open={postDialogState.open}
          onClose={() => setPostDialogState((s) => ({ ...s, open: false }))}
          post={postDialogState.post}
          action={postDialogState.action}
          onConfirm={(reasonText, moderatorNote) => {
            if (postDialogState.action === 'approve') {
              onApprovePost(postDialogState.post!)
            } else {
              onRejectPost(postDialogState.post!, reasonText!, moderatorNote)
            }
            setPostDialogState((s) => ({ ...s, open: false }))
          }}
        />
      )}
    </>
  )
}
