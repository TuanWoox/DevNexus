"use client";

import { Crown, Shield, MoreHorizontal, UserX, ShieldCheck, ShieldOff } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRemoveMember } from "@/features/messages/hooks/groups/use-remove-member";
import { useUpdateRole } from "@/features/messages/hooks/groups/use-update-role";
import { useTransferOwnership } from "@/features/messages/hooks/groups/use-transfer-ownership";
import { toast } from "sonner";
import type { GroupMember } from "@/features/messages/types/contracts";

interface GroupMemberItemProps {
    member: GroupMember;
    chatId: string;
    currentProfileId: string;
    isCurrentUserAdmin: boolean;
}

export function GroupMemberItem({
    member,
    chatId,
    currentProfileId,
    isCurrentUserAdmin,
}: GroupMemberItemProps) {
    const removeMember = useRemoveMember(chatId);
    const updateRole = useUpdateRole(chatId);
    const transferOwnership = useTransferOwnership(chatId);

    const isSelf = member.ProfileId === currentProfileId;
    const isAdmin = member.Role === "ADMIN";
    const avatarUrl = member.AvatarUrl || undefined;

    const handleKick = () => {
        if (isSelf) return;
        removeMember.mutate(member.ProfileId);
    };

    const handlePromote = () => {
        updateRole.mutate({
            profileId: member.ProfileId,
            dto: { Role: "ADMIN" },
        });
    };

    const handleDemote = () => {
        updateRole.mutate({
            profileId: member.ProfileId,
            dto: { Role: "MEMBER" },
        });
    };

    const handleTransfer = () => {
        transferOwnership.mutate(
            { newOwnerProfileId: member.ProfileId },
            {
                onSuccess: (data) => {
                    if (!data.message) {
                        toast.success(`Ownership transferred to ${member.FullName}`);
                    }
                },
            }
        );
    };

    const canManage = isCurrentUserAdmin && !isSelf;

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors group">
            <div className="relative shrink-0">
                <UserAvatar avatarUrl={avatarUrl} fullName={member.FullName} className="h-9 w-9" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">
                        {member.FullName}
                        {isSelf && (
                            <span className="text-xs text-muted-foreground ml-1">(You)</span>
                        )}
                    </p>
                </div>
                {member.NickName && (
                    <p className="text-xs text-muted-foreground truncate">
                        {member.NickName}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                {isAdmin ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-500 bg-amber-500/10 rounded-full px-2 py-0.5">
                        <Crown className="h-3 w-3" />
                        Admin
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <Shield className="h-3 w-3" />
                        Member
                    </span>
                )}

                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="rounded-full p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all"
                                aria-label="Member actions"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {isAdmin ? (
                                <DropdownMenuItem onClick={handleDemote}>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Demote to Member
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem onClick={handlePromote}>
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Promote to Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleTransfer}>
                                        <Crown className="h-4 w-4 mr-2" />
                                        Transfer Ownership
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={handleKick}
                                className="text-destructive focus:text-destructive"
                            >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove from Group
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
