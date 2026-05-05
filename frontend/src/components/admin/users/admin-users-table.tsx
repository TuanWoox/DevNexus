'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AdminProfileDTO } from '@/types/admin/admin-profile-dto';
import { useSuspendUser } from '@/hooks/admin/use-suspend-user';
import { useUnsuspendUser } from '@/hooks/admin/use-unsuspend-user';
import { useUpdateUserRole } from '@/hooks/admin/use-update-user-role';
import { SuspendUserDialog, UnsuspendUserDialog } from './suspend-user-dialog';
import { UpdateRoleDialog } from './update-role-dialog';
import { PenaltyPresetButtons } from './penalty-preset-buttons';

interface AdminUsersTableProps {
  users: AdminProfileDTO[];
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RoleBadge({ role }: { role?: string }) {
  if (role === 'Admin') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
        Admin
      </span>
    );
  }
  if (role === 'Moderator') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
        Moderator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
      User
    </span>
  );
}

function StatusBadge({ isSuspended }: { isSuspended: boolean }) {
  if (isSuspended) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  );
}

type DialogState =
  | { type: 'suspend'; user: AdminProfileDTO }
  | { type: 'unsuspend'; user: AdminProfileDTO }
  | { type: 'role'; user: AdminProfileDTO }
  | null;

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const isAdmin = authUser?.roles?.includes('Admin') ?? false;

  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const updateRoleMutation = useUpdateUserRole();

  function closeDialog() {
    setDialog(null);
  }

  function handleSuspendConfirm(user: AdminProfileDTO) {
    suspendMutation.mutate(
      { id: user.id, dto: { daySuspend: null } },
      { onSettled: closeDialog }
    );
  }

  function handleUnsuspendConfirm(user: AdminProfileDTO) {
    unsuspendMutation.mutate(user.id, { onSettled: closeDialog });
  }

  function handleRoleConfirm(user: AdminProfileDTO, newRole: string) {
    updateRoleMutation.mutate(
      { id: user.userId, dto: { newRole } },
      { onSettled: closeDialog }
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Display Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posts</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-default last:border-0 transition-colors ${
                    user.isSuspended
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : 'hover:bg-card/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{user.displayName}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge isSuspended={user.isSuspended} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.postCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {user.isSuspended ? (
                            <button
                              className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                              onClick={() => setDialog({ type: 'unsuspend', user })}
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 transition-colors"
                              onClick={() => setDialog({ type: 'suspend', user })}
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            className="text-xs px-2 py-1 rounded bg-card border border-default hover:bg-muted disabled:opacity-50 transition-colors"
                            onClick={() => setDialog({ type: 'role', user })}
                          >
                            Change Role
                          </button>
                        </div>
                        <PenaltyPresetButtons user={user} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SuspendUserDialog
        user={dialog?.type === 'suspend' ? dialog.user : null}
        open={dialog?.type === 'suspend'}
        onClose={closeDialog}
        onConfirm={handleSuspendConfirm}
        isPending={suspendMutation.isPending}
      />

      <UnsuspendUserDialog
        user={dialog?.type === 'unsuspend' ? dialog.user : null}
        open={dialog?.type === 'unsuspend'}
        onClose={closeDialog}
        onConfirm={handleUnsuspendConfirm}
        isPending={unsuspendMutation.isPending}
      />

      <UpdateRoleDialog
        user={dialog?.type === 'role' ? dialog.user : null}
        open={dialog?.type === 'role'}
        onClose={closeDialog}
        onConfirm={handleRoleConfirm}
        isPending={updateRoleMutation.isPending}
      />
    </>
  );
}
