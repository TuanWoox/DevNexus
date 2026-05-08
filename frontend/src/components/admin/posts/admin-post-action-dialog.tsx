'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AdminPostDTO } from '@/types/admin/admin-post-dto';
import { ModerationStatusBadge } from './moderation-status-badge';

interface AdminPostActionDialogProps {
  open: boolean;
  onClose: () => void;
  post: AdminPostDTO;
  action: 'approve' | 'reject';
  onConfirm: () => void;
}

export function AdminPostActionDialog({
  open,
  onClose,
  post,
  action,
  onConfirm,
}: AdminPostActionDialogProps) {
  const isApprove = action === 'approve';
  const title = isApprove ? 'Force Approve Post' : 'Force Reject Post';
  const description = isApprove
    ? 'This post will be approved and made visible to all users.'
    : 'This post will be rejected and hidden from public view.';

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">Post</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Current Status</p>
            <ModerationStatusBadge status={post.moderationStatus} />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isApprove ? 'custom' : 'destructive'}
            onClick={onConfirm}
            className={isApprove ? 'btn-emerald' : undefined}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
