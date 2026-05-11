'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SelectTagDTO } from '@/types/admin/admin-tag-dto';

interface DeleteTagDialogProps {
  tag: SelectTagDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (tag: SelectTagDTO) => void;
  isPending: boolean;
}

export function DeleteTagDialog({ tag, open, onClose, onConfirm, isPending }: DeleteTagDialogProps) {
  if (!tag) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
          <AlertDialogDescription>
            Delete <strong>&quot;{tag.name}&quot;</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onConfirm(tag)}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
