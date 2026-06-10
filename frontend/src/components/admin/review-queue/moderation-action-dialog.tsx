'use client';

import { type MouseEvent, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminPostDTO } from '@/types/admin/admin-post-dto';
import { ModerationStatusBadge } from './moderation-status-badge';

interface ModerationActionDialogProps {
  open: boolean;
  onClose: () => void;
  post: AdminPostDTO;
  action: 'approve' | 'reject';
  onConfirm: (reasonText?: string, moderatorNote?: string) => void;
}

export function ModerationActionDialog({
  open,
  onClose,
  post,
  action,
  onConfirm,
}: ModerationActionDialogProps) {
  const [reasonText, setReasonText] = useState('');
  const [moderatorNote, setModeratorNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  const isApprove = action === 'approve';
  const title = isApprove ? 'Force Approve Content' : 'Force Reject Content';
  const description = isApprove
    ? 'This content will be approved and made visible to all users.'
    : 'This content will be rejected and hidden from public view.';
  const trimmedReason = reasonText.trim();

  function resetForm() {
    setReasonText('');
    setModeratorNote('');
    setShowReasonError(false);
  }

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    if (isApprove) {
      onConfirm();
      resetForm();
      return;
    }

    if (!trimmedReason) {
      event.preventDefault();
      setShowReasonError(true);
      return;
    }

    onConfirm(trimmedReason, moderatorNote.trim() || undefined);
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">Content</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Current Status</p>
            <ModerationStatusBadge status={post.moderationStatus} />
          </div>
          {!isApprove && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="force-reject-public-reason">Public Reason</Label>
                <Textarea
                  id="force-reject-public-reason"
                  value={reasonText}
                  onChange={(e) => {
                    setReasonText(e.target.value);
                    if (e.target.value.trim()) setShowReasonError(false);
                  }}
                  maxLength={1000}
                  rows={4}
                  aria-invalid={showReasonError}
                  placeholder="Explain why this content was rejected."
                  className="resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">
                    {showReasonError ? 'Public reason is required.' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{reasonText.length}/1000</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="force-reject-internal-note">
                  Internal Note <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="force-reject-internal-note"
                  value={moderatorNote}
                  onChange={(e) => setModeratorNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Add a moderator-only note."
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{moderatorNote.length}/500</p>
              </div>
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isApprove ? 'custom' : 'destructive'}
            onClick={handleConfirm}
            className={isApprove ? 'btn-emerald' : undefined}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
