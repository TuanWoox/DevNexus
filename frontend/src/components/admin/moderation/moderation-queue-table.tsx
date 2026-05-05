'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto';
import { ModerationResolveDialog } from './moderation-resolve-dialog';

interface ModerationQueueTableProps {
  entries: AdminQueueEntryDTO[];
  isLoading: boolean;
  onApprove: (entry: AdminQueueEntryDTO, note?: string) => void;
  onReject: (entry: AdminQueueEntryDTO, note?: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function tier1ScoreClass(score: number): string {
  if (score >= 0.8) return 'text-destructive font-semibold';
  if (score >= 0.5) return 'text-amber-500 font-semibold';
  return 'text-emerald-500';
}

export function ModerationQueueTable({
  entries,
  isLoading,
  onApprove,
  onReject,
}: ModerationQueueTableProps) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    entry: AdminQueueEntryDTO | null;
    action: 'approve' | 'reject';
  }>({ open: false, entry: null, action: 'approve' });

  function openDialog(entry: AdminQueueEntryDTO, action: 'approve' | 'reject') {
    setDialogState({ open: true, entry, action });
  }

  function closeDialog() {
    setDialogState((prev) => ({ ...prev, open: false }));
  }

  function handleConfirm(note?: string) {
    if (!dialogState.entry) return;
    if (dialogState.action === 'approve') {
      onApprove(dialogState.entry, note);
    } else {
      onReject(dialogState.entry, note);
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

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No pending items in the moderation queue.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-card">
              <th className="px-4 py-3 text-left font-semibold text-heading">Post Title</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Reason</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Score</th>
              <th className="px-4 py-3 text-left font-semibold text-heading">Created</th>
              <th className="px-4 py-3 text-right font-semibold text-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-default last:border-0 hover:bg-card/50 transition-colors">
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="truncate text-foreground">{entry.postTitle}</p>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="truncate text-muted-foreground">{entry.reason}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={tier1ScoreClass(entry.tier1Score)}>
                    {entry.tier1Score.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="custom"
                      size="xs"
                      className="btn-emerald"
                      onClick={() => openDialog(entry, 'approve')}
                      aria-label={`Approve: ${entry.postTitle}`}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => openDialog(entry, 'reject')}
                      aria-label={`Reject: ${entry.postTitle}`}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
}
