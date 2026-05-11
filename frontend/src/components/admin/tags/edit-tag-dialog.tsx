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
import { SelectTagDTO } from '@/types/admin/admin-tag-dto';

interface EditTagDialogProps {
  tag: SelectTagDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string, name: string) => void;
  isPending: boolean;
}

export function EditTagDialog({ tag, open, onClose, onConfirm, isPending }: EditTagDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Initialize name when dialog opens
  const displayName = open && tag ? (name || tag.name) : name;

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && tag) {
      // Dialog opening - initialize with tag name
      setName(tag.name);
      setError('');
    } else if (!isOpen) {
      // Dialog closing - reset state
      setName('');
      setError('');
      onClose();
    }
  }

  function handleClose() {
    setName('');
    setError('');
    onClose();
  }

  function handleSubmit() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Tag name is required');
      return;
    }
    setError('');
    onConfirm(tag!.id, trimmed);
  }

  if (!tag) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Tag</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="edit-tag-name">Tag Name</Label>
          <Input
            id="edit-tag-name"
            value={displayName}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            disabled={isPending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
