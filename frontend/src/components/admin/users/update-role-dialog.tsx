'use client';

import { useEffect, useState } from 'react';
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

interface UpdateRoleDialogProps {
  user: AdminProfileDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (user: AdminProfileDTO, newRole: string) => void;
  isPending: boolean;
}

const ROLES = ['User', 'Moderator', 'Admin'];

export function UpdateRoleDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending,
}: UpdateRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role ?? 'User');

  const [prevUser, setPrevUser] = useState<AdminProfileDTO | null>(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setSelectedRole(user?.role ?? 'User');
  }

  if (!user) return null;

  function handleConfirm() {
    if (user) onConfirm(user, selectedRole);
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Role</AlertDialogTitle>
          <AlertDialogDescription>
            Change role for <strong>{user.displayName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-1 py-2">
          <select
            className="w-full rounded-md border border-default bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isPending}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
