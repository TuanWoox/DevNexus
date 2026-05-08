'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { AdminProfileDTO } from '@/types/admin/admin-profile-dto'
import { useSuspendUser } from '@/hooks/admin/use-suspend-user'
import { useUnsuspendUser } from '@/hooks/admin/use-unsuspend-user'
import { useUpdateUserRole } from '@/hooks/admin/use-update-user-role'
import { useBanUser, useTimeout7Days, useTimeout30Days } from '@/hooks/admin/use-user-penalty-presets'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SuspendUserDialog, UnsuspendUserDialog } from './suspend-user-dialog'
import { UpdateRoleDialog } from './update-role-dialog'

interface AdminUsersTableProps {
  users: AdminProfileDTO[]
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || 'U'
}

function RoleBadge({ role }: { role?: string | null }) {
  if (role === 'Admin') return <span className="badge-red">Admin</span>
  if (role === 'Moderator') return <span className="badge-purple">Moderator</span>
  return <span className="badge-default">User</span>
}

function StatusBadge({ isSuspended }: { isSuspended: boolean }) {
  if (isSuspended) return <span className="badge-amber">Suspended</span>
  return <span className="badge-emerald">Active</span>
}

function UserCell({ user }: { user: AdminProfileDTO }) {
  return (
    <div className="flex items-center gap-3 min-w-[260px]">
      <Avatar className="size-9 border border-default">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
        <AvatarFallback>{getInitial(user.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-heading">{user.displayName}</span>
        <span className="truncate text-xs font-mono text-muted-foreground">{user.email ?? '—'}</span>
      </div>
    </div>
  )
}

type DialogState =
  | { type: 'suspend'; user: AdminProfileDTO }
  | { type: 'unsuspend'; user: AdminProfileDTO }
  | { type: 'role'; user: AdminProfileDTO }
  | null

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const { user: authUser } = useSelector((state: RootState) => state.auth)
  const isAdmin = authUser?.roles?.includes('Admin') ?? false

  const suspendMutation = useSuspendUser()
  const unsuspendMutation = useUnsuspendUser()
  const updateRoleMutation = useUpdateUserRole()
  const timeout7Mutation = useTimeout7Days()
  const timeout30Mutation = useTimeout30Days()
  const banMutation = useBanUser()

  function closeDialog() { setDialog(null) }

  function handleSuspendConfirm(user: AdminProfileDTO) {
    suspendMutation.mutate(
      { id: user.id, dto: { daySuspend: null } },
      { onSettled: closeDialog }
    )
  }

  function handleUnsuspendConfirm(user: AdminProfileDTO) {
    unsuspendMutation.mutate(user.id, { onSettled: closeDialog })
  }

  function handleRoleConfirm(user: AdminProfileDTO, newRole: string) {
    updateRoleMutation.mutate(
      { id: user.userId, dto: { newRole } },
      { onSettled: closeDialog }
    )
  }

  const actionPending =
    suspendMutation.isPending ||
    unsuspendMutation.isPending ||
    updateRoleMutation.isPending ||
    timeout7Mutation.isPending ||
    timeout30Mutation.isPending ||
    banMutation.isPending

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-default bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-default">
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Reputation</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Posts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`h-14 border-b border-default last:border-0 transition-colors ${
                    user.isSuspended
                      ? 'bg-amber-500/5 hover:bg-amber-500/10'
                      : 'hover:bg-subtle'
                  }`}
                >
                  <td className="px-4 py-2"><UserCell user={user} /></td>
                  <td className="px-4 py-2"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-2"><StatusBadge isSuspended={user.isSuspended} /></td>
                  <td className="px-4 py-2 text-right font-mono text-foreground/85">
                    {(user.reputationPoints ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground">{(user.postCount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <span className="font-mono">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" disabled={actionPending} aria-label={`Open actions for ${user.displayName}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Admin actions</DropdownMenuLabel>
                          {user.isSuspended ? (
                            <DropdownMenuItem onSelect={() => setDialog({ type: 'unsuspend', user })}>
                              Unsuspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setDialog({ type: 'suspend', user })}>
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => setDialog({ type: 'role', user })}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => timeout7Mutation.mutate(user.id)}>
                            Apply 7-Day Timeout
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => timeout30Mutation.mutate(user.id)}>
                            Apply 30-Day Timeout
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => banMutation.mutate(user.id)}>
                            Permanently Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
  )
}
