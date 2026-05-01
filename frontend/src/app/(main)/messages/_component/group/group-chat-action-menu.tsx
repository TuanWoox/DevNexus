"use client";

import { MoreVertical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chat } from "@/features/messages/types/contracts";
import { useUpdateChatSetting } from "@/features/messages/hooks/chatsettings/use-update-chat-setting";
import { useDeleteAllMessages } from "@/features/messages/hooks/chatsettings/use-delete-all-messages";
import { toast } from "sonner";
import { useMemo } from "react";

interface GroupChatActionMenuProps {
    chat: Chat;
    onBack?: () => void;
}

export function GroupChatActionMenu({ chat, onBack }: GroupChatActionMenuProps) {
    const updateChatSetting = useUpdateChatSetting();
    const deleteAllMessages = useDeleteAllMessages();

    const mySetting = useMemo(() => {
        return chat?.ChatSettings?.[0];
    }, [chat?.ChatSettings]);

    if (!mySetting) return null;

    const canPin = !mySetting.IsArchived && !mySetting.IsRequested;

    const handleToggleArchive = () => {
        updateChatSetting.mutate(
            {
                Id: mySetting.Id,
                IsArchived: !mySetting.IsArchived,
                IsMuted: null,
                IsPinned: null,
                IsRequested: null,
                MuteUntil: null,
            },
            {
                onSuccess: () => {
                    if (chat.Id === mySetting.ChatId && onBack) onBack?.();
                },
            }
        );
    };

    const handleTogglePin = () => {
        if (!canPin) return;
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsPinned: !mySetting.IsPinned,
            IsArchived: null,
            IsMuted: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleToggleMute = () => {
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsMuted: !mySetting.IsMuted,
            IsArchived: null,
            IsPinned: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleClearMessages = () => {
        deleteAllMessages.mutate(mySetting.Id, {
            onSuccess: () => {
                if (chat.Id === mySetting.ChatId) {
                    toast.success("Clear message successfully");
                    onBack?.();
                }
            },
        });
    };

    const handleAcceptRequest = () => {
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsRequested: false,
            IsArchived: null,
            IsMuted: null,
            IsPinned: null,
            MuteUntil: null,
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open group actions">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {canPin && (
                    <DropdownMenuItem onSelect={handleTogglePin}>
                        {mySetting.IsPinned ? "Unpin chat" : "Pin chat"}
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleToggleMute}>
                    {mySetting.IsMuted ? "Unmute chat" : "Mute chat"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleToggleArchive}>
                    {mySetting.IsArchived ? "Unarchive chat" : "Archive chat"}
                </DropdownMenuItem>
                {mySetting.IsRequested && (
                    <DropdownMenuItem onSelect={handleAcceptRequest}>
                        Accept request
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleClearMessages}>
                    Clear messages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => toast.info("Leave group coming soon")}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave group
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
