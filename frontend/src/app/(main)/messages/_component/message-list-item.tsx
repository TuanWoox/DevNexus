"use client";

import { Pin, VolumeX } from "lucide-react";
import { ChatListItem } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MessageListItemProps {
    item: ChatListItem;
    isActive?: boolean;
    onSelect?: (chatId: string) => void;
}

function toRelativeTime(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return new Date(isoDate).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getTitle(item: ChatListItem): string {
    if (item.Chat.IsGroup) return item.Chat.Name || "Group Chat";
    return item.Participants[0]?.FullName || item.Chat.Name || "Direct Message";
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function MessageListItem({ item, isActive = false, onSelect }: MessageListItemProps) {
    const title = getTitle(item);
    const avatarUrl = item.Participants[0]?.AvatarUrl ?? item.Chat.ChatPictureUrl ?? undefined;
    const hasUnread = item.UnreadCount > 0;
    const lastPreview = item.LastMessage?.Content ?? "No messages yet";

    return (
        <button
            type="button"
            onClick={() => onSelect?.(item.Chat.Id)}
            className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                "hover:bg-accent/60",
                isActive && "bg-accent",
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} alt={title} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(title)}
                    </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <span className={cn(
                        "truncate text-sm",
                        hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                    )}>
                        {title}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                        {item.CurrentSetting.IsPinned && <Pin className="h-3 w-3 text-primary" />}
                        {item.CurrentSetting.IsMuted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">
                            {item.LastMessage ? toRelativeTime(item.LastMessage.DateCreated) : ""}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className={cn(
                        "truncate text-xs",
                        hasUnread ? "font-medium text-foreground/90" : "text-muted-foreground"
                    )}>
                        {lastPreview}
                    </p>
                    {hasUnread && (
                        <Badge className="shrink-0 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold">
                            {item.UnreadCount > 99 ? "99+" : item.UnreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </button>
    );
}
