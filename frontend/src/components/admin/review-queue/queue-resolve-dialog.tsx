'use client';

import { useState } from 'react';
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
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto';

interface QueueResolveDialogProps {
  open: boolean;
  onClose: () => void;
  entry: AdminQueueEntryDTO;
  action: 'approve' | 'reject';
  onConfirm: (note?: string) => void;
}

export function QueueResolveDialog({
  open,
  onClose,
  entry,
  action,
  onConfirm,
}: QueueResolveDialogProps) {
  const [note, setNote] = useState('');

  const isApprove = action === 'approve';
  const title = isApprove ? 'Approve Entry' : 'Reject Entry';
  const description = isApprove
    ? 'This content will be approved and published.'
    : 'This content will be rejected and removed from the queue.';

  function handleConfirm() {
    onConfirm(note.trim() || undefined);
    setNote('');
  }

  function handleClose() {
    setNote('');
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
            <p className="text-sm text-muted-foreground line-clamp-2">{entry.postTitle || entry.entityType || 'Content'}</p>
          </div>
          {entry.reason && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">Reason</p>
              <p className="text-sm text-muted-foreground">{entry.reason}</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="moderator-note" className="text-sm font-semibold text-foreground">
              Moderator Note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="moderator-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a note..."
              className="w-full rounded-md border border-default bg-input px-3 py-2 text-sm text-foreground/85 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
          </div>
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
