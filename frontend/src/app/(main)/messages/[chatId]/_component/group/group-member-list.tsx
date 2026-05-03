"use client";

import { Users, Loader2, UserPlus } from "lucide-react";
import { useGroupMembers } from "@/features/messages/hooks/groups/use-group-members";
import { GroupMemberItem } from "./group-member-item";
import type { Chat } from "@/features/messages/types/contracts";

interface GroupMemberListProps {
    chat: Chat;
    currentProfileId: string;
    onAddMembers: () => void;
}

export function GroupMemberList({ chat, currentProfileId, onAddMembers }: GroupMemberListProps) {
    const { data: members, isLoading } = useGroupMembers(chat.Id);

    const mySetting = chat.ChatSettings?.find((s) => s.ProfileId === currentProfileId);
    const isAdmin = mySetting?.Role === "ADMIN";

    return (
        <div className="py-3">
            <div className="flex items-center justify-between px-4 pt-1 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Members
                    {members && (
                        <span className="ml-1 text-muted-foreground/70">
                            ({members.length})
                        </span>
                    )}
                </h3>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={onAddMembers}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label="Add members"
                    >
                        <UserPlus className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : members && members.length > 0 ? (
                <div className="flex flex-col">
                    {members.map((member) => (
                        <GroupMemberItem
                            key={member.ProfileId}
                            member={member}
                            chatId={chat.Id}
                            currentProfileId={currentProfileId}
                            isCurrentUserAdmin={!!isAdmin}
                        />
                    ))}
                </div>
            ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                    No members found.
                </p>
            )}
        </div>
    );
}
