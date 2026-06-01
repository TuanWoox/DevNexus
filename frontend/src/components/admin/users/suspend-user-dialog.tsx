'use client';

import { useState } from 'react';
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
import { AdminProfileDTO, AdminSuspendUserDTO } from '@/types/admin/admin-profile-dto';

interface SuspendUserDialogProps {
  user: AdminProfileDTO | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (user: AdminProfileDTO, dto: AdminSuspendUserDTO) => void;
  isPending: boolean;
  defaultType?: string;
}

export function SuspendUserDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending,
  defaultType = '7',
}: SuspendUserDialogProps) {
  const [suspendType, setSuspendType] = useState<string>(defaultType);
  const [customDays, setCustomDays] = useState<number>(7);
  const [reason, setReason] = useState<string>('');

  const [prevUser, setPrevUser] = useState<AdminProfileDTO | null>(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setSuspendType(defaultType);
    setCustomDays(7);
    setReason('');
  }

  if (!user) return null;

  function handleConfirm() {
    if (!user) return;

    let days: number | null = null;
    if (suspendType === '7') days = 7;
    else if (suspendType === '30') days = 30;
    else if (suspendType === 'custom') days = customDays;

    onConfirm(user, {
      daySuspend: days,
      reason: reason.trim() || null,
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend User</AlertDialogTitle>
          <AlertDialogDescription>
            Choose duration and state a clear violation reason for suspending <strong>{user.displayName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suspension Duration
            </label>
            <select
              className="w-full rounded-md border border-default bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={suspendType}
              onChange={(e) => setSuspendType(e.target.value)}
              disabled={isPending}
            >
              <option value="7">Temporary (7 Days)</option>
              <option value="30">Temporary (30 Days)</option>
              <option value="custom">Temporary (Custom Days)</option>
              <option value="indefinite">Indefinite (Permanent Ban)</option>
            </select>
          </div>

          {/* Custom Days Input */}
          {suspendType === 'custom' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Number of Days
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-default bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isPending}
              />
            </div>
          )}

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reason for Suspension
            </label>
            <textarea
              className="w-full rounded-md border border-default bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[90px] resize-none"
              placeholder="e.g., Severe violation of community guidelines regarding content quality or harassment..."
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
            <span className="text-[11px] text-muted-foreground block text-right">
              {reason.length}/500 characters
            </span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Suspending…' : 'Suspend User'}
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
            variant="custom"
            className="btn-emerald"
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
