"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSetting } from "@/features/messages/types/contracts";

interface ChatActionMenuProps {
    setting: ChatSetting;
    onToggleArchive: () => void;
    onTogglePin: () => void;
    onToggleMute: () => void;
    onClearMessages: () => void;
    onAcceptRequest: () => void;
}

export function ChatActionMenu({
    setting,
    onToggleArchive,
    onTogglePin,
    onToggleMute,
    onClearMessages,
    onAcceptRequest,
}: ChatActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open chat actions">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={onTogglePin}>
                    {setting.IsPinned ? "Unpin chat" : "Pin chat"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onToggleMute}>
                    {setting.IsMuted ? "Unmute chat" : "Mute chat"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onToggleArchive}>
                    {setting.IsArchived ? "Unarchive chat" : "Archive chat"}
                </DropdownMenuItem>
                {setting.IsRequested && (
                    <DropdownMenuItem onSelect={onAcceptRequest}>Accept request</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onClearMessages}>
                    Clear messages
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
