'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, CheckCircle2, XCircle, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { AdminPostDTO, ModerationStatus } from '@/types/admin/admin-post-dto'
import { ModerationStatusBadge } from './moderation-status-badge'
import { AdminPostActionDialog } from './admin-post-action-dialog'
import { PostOverviewSheet } from './post-overview-sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TabValue = 'all' | 'pending' | 'approved' | 'flagged' | 'inreview'

interface AdminPostsTableProps {
  posts: AdminPostDTO[]
  isLoading: boolean
  onApprove: (post: AdminPostDTO) => void
  onReject: (post: AdminPostDTO) => void
}

function mapPostType(type: string | number): string {
  if (typeof type === 'number') return type === 0 ? 'Markdown' : type === 1 ? 'WYSIWYG' : 'Unknown'
  return type === 'MarkDown' ? 'Markdown' : type === 'WYSIWYG' ? 'WYSIWYG' : String(type)
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function tabCount(posts: AdminPostDTO[], tab: TabValue): number {
  if (tab === 'all') return posts.length
  const map: Record<Exclude<TabValue, 'all'>, ModerationStatus> = {
    pending: 'Pending', approved: 'Approved', flagged: 'Flagged', inreview: 'InReview',
  }
  return posts.filter((p) => p.moderationStatus === map[tab]).length
}

function filterPosts(posts: AdminPostDTO[], tab: TabValue): AdminPostDTO[] {
  if (tab === 'all') return posts
  const map: Record<Exclude<TabValue, 'all'>, ModerationStatus> = {
    pending: 'Pending', approved: 'Approved', flagged: 'Flagged', inreview: 'InReview',
  }
  return posts.filter((p) => p.moderationStatus === map[tab])
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

export function AdminPostsTable({ posts, isLoading, onApprove, onReject }: AdminPostsTableProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [sheetState, setSheetState] = useState<{ open: boolean; post: AdminPostDTO | null }>({
    open: false, post: null,
  })
  const [dialogState, setDialogState] = useState<{
    open: boolean; post: AdminPostDTO | null; action: 'approve' | 'reject'
  }>({ open: false, post: null, action: 'approve' })

  function openSheet(post: AdminPostDTO) { setSheetState({ open: true, post }) }
  function closeSheet() { setSheetState((s) => ({ ...s, open: false })) }
  function openDialog(post: AdminPostDTO, action: 'approve' | 'reject') {
    setDialogState({ open: true, post, action })
  }
  function closeDialog() { setDialogState((s) => ({ ...s, open: false })) }
  function handleConfirm() {
    if (!dialogState.post) return
    dialogState.action === 'approve' ? onApprove(dialogState.post) : onReject(dialogState.post)
    closeDialog()
  }

  const filtered = filterPosts(posts, activeTab)

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          {(['all', 'pending', 'approved', 'flagged', 'inreview'] as TabValue[]).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab === 'inreview' ? 'In Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                {tabCount(posts, tab)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-xl">
          No posts in this category.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Title</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Author</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Votes</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider font-medium">Created</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0 hover:bg-subtle transition-colors">
                  <td className="px-4 py-3 max-w-[240px]">
                    <button
                      type="button"
                      onClick={() => openSheet(post)}
                      className="text-left truncate text-foreground/85 font-medium cursor-pointer hover:underline hover:text-primary transition-colors w-full block"
                    >
                      {post.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <AuthorCell author={post.author ? { fullName: post.author.fullName, id: post.author.id } : undefined} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-default font-mono text-xs">{post.entityType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ModerationStatusBadge status={post.moderationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="w-3 h-3" />{post.upvoteCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsDown className="w-3 h-3" />{post.downvoteCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-muted-foreground">{formatDate(post.dateCreated)}</span>
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
                          <DropdownMenuItem onClick={() => openSheet(post)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {post.moderationStatus !== 'Approved' && (
                            <DropdownMenuItem onClick={() => openDialog(post, 'approve')}>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Force Approve
                            </DropdownMenuItem>
                          )}
                          {post.moderationStatus !== 'Flagged' && (
                            <DropdownMenuItem variant="destructive" onClick={() => openDialog(post, 'reject')}>
                              <XCircle className="w-4 h-4" />
                              Force Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(post.id).catch(() => {})}>
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

      {sheetState.post && (
        <PostOverviewSheet
          open={sheetState.open}
          onClose={closeSheet}
          post={sheetState.post}
          onApprove={(p) => openDialog(p, 'approve')}
          onReject={(p) => openDialog(p, 'reject')}
        />
      )}

      {dialogState.post && (
        <AdminPostActionDialog
          open={dialogState.open}
          onClose={closeDialog}
          post={dialogState.post}
          action={dialogState.action}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
