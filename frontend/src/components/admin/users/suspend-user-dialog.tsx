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
import { AdminProfileDTO } from '@/types/admin/admin-profile-dto';

interface SuspendUserDialogProps {
  user: AdminProfileDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (user: AdminProfileDTO) => void;
  isPending: boolean;
}

export function SuspendUserDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending,
}: SuspendUserDialogProps) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend User</AlertDialogTitle>
          <AlertDialogDescription>
            Suspend <strong>{user.displayName}</strong> indefinitely? They will not be able to post or interact until unsuspended.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onConfirm(user)}
            disabled={isPending}
          >
            {isPending ? 'Suspending…' : 'Suspend'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UnsuspendUserDialogProps {
  user: AdminProfileDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (user: AdminProfileDTO) => void;
  isPending: boolean;
}

export function UnsuspendUserDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending,
}: UnsuspendUserDialogProps) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
          <AlertDialogDescription>
            Restore access for <strong>{user.displayName}</strong>? They will be able to post and interact again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => onConfirm(user)}
            disabled={isPending}
          >
            {isPending ? 'Unsuspending…' : 'Unsuspend'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
