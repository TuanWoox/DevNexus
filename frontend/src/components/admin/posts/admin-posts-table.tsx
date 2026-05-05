'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdminPostDTO } from '@/types/admin/admin-post-dto';
import { ModerationStatusBadge } from './moderation-status-badge';
import { AdminPostActionDialog } from './admin-post-action-dialog';

interface AdminPostsTableProps {
  posts: AdminPostDTO[];
  isLoading: boolean;
  onApprove: (post: AdminPostDTO) => void;
  onReject: (post: AdminPostDTO) => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function AdminPostsTable({
  posts,
  isLoading,
  onApprove,
  onReject,
}: AdminPostsTableProps) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    post: AdminPostDTO | null;
    action: 'approve' | 'reject';
  }>({ open: false, post: null, action: 'approve' });

  function openDialog(post: AdminPostDTO, action: 'approve' | 'reject') {
    setDialogState({ open: true, post, action });
  }

  function closeDialog() {
    setDialogState((prev) => ({ ...prev, open: false }));
  }

  function handleConfirm() {
    if (!dialogState.post) return;
    if (dialogState.action === 'approve') {
      onApprove(dialogState.post);
    } else {
      onReject(dialogState.post);
    }
    closeDialog();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No posts found.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-card">
              <th className="px-4 py-3 text-left font-semibold text-heading">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Author</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Votes</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Created</th>
              <th className="px-4 py-3 text-right font-semibold text-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-default last:border-0 hover:bg-card/50 transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="truncate text-foreground">{post.title}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {post.postType}
                </td>
                <td className="px-4 py-3 max-w-[120px]">
                  <p className="truncate text-muted-foreground">{post.authorName ?? '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <ModerationStatusBadge status={post.moderationStatus} />
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  ↑{post.upvoteCount} ↓{post.downvoteCount}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(post.dateCreated)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {post.moderationStatus !== 'Approved' && (
                      <Button
                        type="button"
                        variant="custom"
                        size="xs"
                        className="btn-emerald"
                        onClick={() => openDialog(post, 'approve')}
                        aria-label={`Approve: ${post.title}`}
                      >
                        Approve
                      </Button>
                    )}
                    {post.moderationStatus !== 'Flagged' && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        onClick={() => openDialog(post, 'reject')}
                        aria-label={`Reject: ${post.title}`}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
}
