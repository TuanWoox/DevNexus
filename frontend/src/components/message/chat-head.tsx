"use client";

import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getProfileId, getTitle, getAvatarUrl, getInitials } from "@/features/messages/utils/message-service.helper";
import { useChatWindows } from "@/features/messages/context/chat-windows-context";
import { useChatById } from "@/features/messages/hooks/chats/use-chat-by-id";

interface Props {
    chatId: string;
}

export function ChatHead({ chatId }: Props) {
    const { restoreChat, closeChat, unreadCounts } = useChatWindows();
    const currentProfileId = useSelector((s: RootState) => getProfileId(s.auth.user?.profileId));
    const { chat } = useChatById(chatId);

    const title = chat ? getTitle(chat, currentProfileId) : "…";
    const avatarUrl = chat ? getAvatarUrl(chat, currentProfileId) : undefined;
    const unread = unreadCounts[chatId] ?? 0;

    return (
        <div className="relative group animate-in zoom-in-75 duration-150">
            <button
                onClick={() => restoreChat(chatId)}
                className={cn(
                    "h-12 w-12 rounded-full shadow-lg border-2 border-background overflow-hidden",
                    "ring-2 ring-primary/20 hover:ring-primary/60 transition-all duration-150"
                )}
                aria-label={`Open chat with ${title}`}
            >
                <Avatar className="h-full w-full">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {getInitials(title)}
                    </AvatarFallback>
                </Avatar>
            </button>

            {/* Unread badge */}
            {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
                    {unread > 99 ? "99+" : unread}
                </span>
            )}

            {/* Close button shown on hover — only visible when no unread badge */}
            {unread === 0 && (
                <button
                    onClick={() => closeChat(chatId)}
                    className={cn(
                        "absolute -top-1 -right-1 h-4 w-4 rounded-full",
                        "bg-muted border border-border flex items-center justify-center",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    )}
                    aria-label="Close"
                >
                    <X className="h-2.5 w-2.5" />
                </button>
            )}
        </div>
    );
}
