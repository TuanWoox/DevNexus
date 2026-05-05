'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { SelectTagDTO } from '@/types/admin/admin-tag-dto';

interface MergeTagsDialogProps {
  tags: SelectTagDTO[];
  open: boolean;
  onClose: () => void;
  onConfirm: (sourceTagId: string, targetTagId: string) => void;
  isPending: boolean;
}

export function MergeTagsDialog({ tags, open, onClose, onConfirm, isPending }: MergeTagsDialogProps) {
  const [sourceTagId, setSourceTagId] = useState('');
  const [targetTagId, setTargetTagId] = useState('');

  const isSame = sourceTagId !== '' && sourceTagId === targetTagId;
  const isDisabled = !sourceTagId || !targetTagId || isSame || isPending;

  function handleClose() {
    setSourceTagId('');
    setTargetTagId('');
    onClose();
  }

  function handleSubmit() {
    if (isDisabled) return;
    onConfirm(sourceTagId, targetTagId);
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge Tags</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="merge-source">Source Tag (will be deleted)</Label>
            <select
              id="merge-source"
              value={sourceTagId}
              onChange={(e) => setSourceTagId(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">select...</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="merge-target">Target Tag (posts moved here)</Label>
            <select
              id="merge-target"
              value={targetTagId}
              onChange={(e) => setTargetTagId(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">select...</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠ All posts from source will be moved to target. Source tag will be deleted.
          </p>

          {isSame && (
            <p className="text-xs text-destructive">Source and target tags must be different</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleSubmit}
            disabled={isDisabled}
          >
            {isPending ? 'Merging…' : 'Merge'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
