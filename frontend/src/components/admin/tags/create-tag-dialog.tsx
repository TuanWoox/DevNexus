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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateTagDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isPending: boolean;
}

export function CreateTagDialog({ open, onClose, onConfirm, isPending }: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleClose() {
    setName('');
    setError('');
    onClose();
  }

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tag name is required');
      return;
    }
    setError('');
    onConfirm(trimmed);
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Tag</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="create-tag-name">Tag Name</Label>
          <Input
            id="create-tag-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="e.g. javascript"
            disabled={isPending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Creating…' : 'Create'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
