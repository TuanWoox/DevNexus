'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, MoreHorizontal, CheckCircle2, XCircle, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { AdminPostDTO, ModerationStatus, PostType } from '@/types/admin/admin-post-dto'
import { ModerationResolveDialog } from '../moderation/moderation-resolve-dialog'
import { PostDetailSheet } from '../moderation/post-detail-sheet'
import { PostOverviewSheet } from './post-overview-sheet'
import { AdminPostActionDialog } from './admin-post-action-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TabValue = 'needs-review' | 'published' | 'flagged' | 'all'

interface UnifiedPostsTableProps {
  queueEntries: AdminQueueEntryDTO[]
  allPosts: AdminPostDTO[]
  tabCounts: Record<TabValue, number>
  isLoading: boolean
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  onApproveQueue: (entry: AdminQueueEntryDTO, note?: string) => void
  onRejectQueue: (entry: AdminQueueEntryDTO, note?: string) => void
  onApprovePost: (post: AdminPostDTO) => void
  onRejectPost: (post: AdminPostDTO, reasonText: string, moderatorNote?: string) => void
}

// Map raw enum numbers to readable labels
function mapPostType(type: PostType | number): string {
  if (typeof type === 'number') {
    return type === 0 ? 'Markdown' : type === 1 ? 'WYSIWYG' : 'Unknown'
  }
  return type === 'MarkDown' ? 'Markdown' : type === 'WYSIWYG' ? 'WYSIWYG' : String(type)
}

function mapModerationStatus(status: ModerationStatus | number): { label: string; className: string } {
  if (typeof status === 'number') {
    // Map numeric enums: 0=Pending, 1=Approved, 2=Flagged, 3=InReview
    switch (status) {
      case 0: return { label: 'Pending', className: 'badge-amber' }
      case 1: return { label: 'Approved', className: 'badge-emerald' }
      case 2: return { label: 'Flagged', className: 'badge-red' }
      case 3: return { label: 'In Review', className: 'badge-cyan' }
      default: return { label: 'Unknown', className: 'badge-default' }
    }
  }

  switch (status) {
    case 'Pending': return { label: 'Pending', className: 'badge-amber' }
    case 'Approved': return { label: 'Approved', className: 'badge-emerald' }
    case 'Flagged': return { label: 'Flagged', className: 'badge-red' }
    case 'InReview': return { label: 'In Review', className: 'badge-cyan' }
    default: return { label: String(status), className: 'badge-default' }
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

function AuthorCell({ author }: { author?: { fullName: string; id: string } }) {
  if (!author) return <span className="text-xs text-muted-foreground">—</span>
  const initials = author.fullName.slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-primary">{initials}</span>
      </div>
      <span className="font-mono text-xs text-muted-foreground truncate max-w-[100px]">{author.fullName}</span>
    </div>
  )
}

// Unified row type
type UnifiedRow = {
  type: 'queue' | 'post'
  queueEntry?: AdminQueueEntryDTO
  post?: AdminPostDTO
}

function buildUnifiedRows(
  queueEntries: AdminQueueEntryDTO[],
  allPosts: AdminPostDTO[],
  activeTab: TabValue
): UnifiedRow[] {
  if (activeTab === 'needs-review') {
    // Backend already filtered for Pending/Flagged, show queue entries
    return queueEntries
      .filter((e) => !e.resolution) // Only unresolved
      .map((e) => ({ type: 'queue' as const, queueEntry: e }))
  }

  if (activeTab === 'published') {
    // Backend already filtered for Approved posts
    return allPosts.map((p) => ({ type: 'post' as const, post: p }))
  }

  if (activeTab === 'flagged') {
    // Backend already filtered for Flagged posts
    return allPosts.map((p) => ({ type: 'post' as const, post: p }))
  }

  // 'all' tab: show all posts (backend returns everything)
  return allPosts.map((p) => ({ type: 'post' as const, post: p }))
}

export function UnifiedPostsTable({
  queueEntries,
  allPosts,
  tabCounts,
  isLoading,
  activeTab,
  onTabChange,
  onApproveQueue,
  onRejectQueue,
  onApprovePost,  
  onRejectPost,
}: UnifiedPostsTableProps) {

  // Sheet states
  const [queueSheetState, setQueueSheetState] = useState<{ open: boolean; entry: AdminQueueEntryDTO | null }>({
    open: false, entry: null,
  })
  const [postSheetState, setPostSheetState] = useState<{ open: boolean; post: AdminPostDTO | null }>({
    open: false, post: null,
  })

  // Dialog states
  const [queueDialogState, setQueueDialogState] = useState<{
    open: boolean; entry: AdminQueueEntryDTO | null; action: 'approve' | 'reject'
  }>({ open: false, entry: null, action: 'approve' })

  const [postDialogState, setPostDialogState] = useState<{
    open: boolean; post: AdminPostDTO | null; action: 'approve' | 'reject'
  }>({ open: false, post: null, action: 'approve' })

  const rows = buildUnifiedRows(queueEntries, allPosts, activeTab)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="needs-review">
              Needs Review
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                {tabCounts['needs-review'].toLocaleString()}
              </span>
            </TabsTrigger>
            <TabsTrigger value="published">
              Published
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                {tabCounts.published.toLocaleString()}
              </span>
            </TabsTrigger>
            <TabsTrigger value="flagged">
              Flagged
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                {tabCounts.flagged.toLocaleString()}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all">
              All Posts
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                {tabCounts.all.toLocaleString()}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          No posts in this category.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Title</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Author</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                {(activeTab === 'needs-review' || activeTab === 'all') && (
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Score
                    </span>
                  </th>
                )}
                {(activeTab === 'published' || activeTab === 'all') && (
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Votes</th>
                )}
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Created</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isQueue = row.type === 'queue'
                const entry = row.queueEntry
                const post = row.post

                const title = isQueue ? entry!.postTitle : post!.title
                const author = isQueue
                  ? (entry!.author ? { fullName: entry!.author.fullName, id: entry!.author.id } : undefined)
                  : (post!.author ? { fullName: post!.author.fullName, id: post!.author.id } : undefined)
                const entityType = isQueue ? entry!.entityType : post!.entityType
                const status = isQueue
                  ? (entry!.resolution ? { label: entry!.resolution, className: entry!.resolution === 'Approved' ? 'badge-emerald' : 'badge-red' } : { label: 'Pending', className: 'badge-amber' })
                  : mapModerationStatus(post!.moderationStatus)
                const aiScore = isQueue ? entry!.tier1Score : undefined
                const votes = isQueue ? undefined : { up: post!.upvoteCount, down: post!.downvoteCount }
                const created = isQueue ? entry!.createdAt : post!.dateCreated

                return (
                  <tr key={`${row.type}-${idx}`} className="border-b border-border last:border-0 hover:bg-subtle transition-colors">
                    <td className="px-4 py-3 max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (isQueue) {
                            setQueueSheetState({ open: true, entry: entry! })
                          } else {
                            setPostSheetState({ open: true, post: post! })
                          }
                        }}
                        className="text-left truncate text-foreground/85 font-medium cursor-pointer hover:underline hover:text-primary transition-colors w-full block"
                      >
                        {title || 'Untitled Post'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <AuthorCell author={author} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-default font-mono text-xs">{entityType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={status.className}>{status.label}</span>
                    </td>
                    {(activeTab === 'needs-review' || activeTab === 'all') && (
                      <td className="px-4 py-3">
                        {aiScore !== undefined ? <Tier1ScoreBadge score={aiScore} /> : '—'}
                      </td>
                    )}
                    {(activeTab === 'published' || activeTab === 'all') && (
                      <td className="px-4 py-3">
                        {votes ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-0.5">
                              <ThumbsUp className="w-3 h-3" />{votes.up}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <ThumbsDown className="w-3 h-3" />{votes.down}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground">{formatDate(created)}</span>
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
                            <DropdownMenuItem
                              onClick={() => {
                                if (isQueue) {
                                  setQueueSheetState({ open: true, entry: entry! })
                                } else {
                                  setPostSheetState({ open: true, post: post! })
                                }
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isQueue ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setQueueDialogState({ open: true, entry: entry!, action: 'approve' })}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  Quick Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setQueueDialogState({ open: true, entry: entry!, action: 'reject' })}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Quick Reject
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {post!.moderationStatus !== 'Approved' && post!.moderationStatus !== 1 && (
                                  <DropdownMenuItem
                                    onClick={() => setPostDialogState({ open: true, post: post!, action: 'approve' })}
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Force Approve
                                  </DropdownMenuItem>
                                )}
                                {post!.moderationStatus !== 'Flagged' && post!.moderationStatus !== 2 && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setPostDialogState({ open: true, post: post!, action: 'reject' })}
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
      )}

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
