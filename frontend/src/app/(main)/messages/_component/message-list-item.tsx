"use client";

import { Chat } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle, getInitials, toRelativeTime, getProfileId } from "@/features/messages/utils/message-service.helper";
import { Pin, BellOff } from "lucide-react";

interface MessageListItemProps {
    item: Chat;
    isActive?: boolean;
    onSelect?: (item: Chat) => void;
}


export function MessageListItem({ item, isActive = false, onSelect }: MessageListItemProps) {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const title = getTitle(item, currentProfileId);
    const avatarUrl = getAvatarUrl(item, currentProfileId);

    const lastMessage = item.Messages?.[0];
    const messageContent = lastMessage?.Content;
    const firstMedia = lastMessage?.Medias?.[0];
    const isCurrentUserSender = lastMessage?.SenderId === currentProfileId;
    const isUnread =
        lastMessage &&
        lastMessage.SenderId !== currentProfileId &&
        !lastMessage.MessageReadReceipt?.some((r) => r.ReaderId === currentProfileId);
    const currentSetting = item?.ChatSettings?.[0];

    const isPinned = currentSetting?.IsPinned;
    const isMuted = currentSetting?.IsMuted;

    const mediaLabel: Record<string, string> = {
        Image: "[Image]",
        Video: "[Video]",
        File: "[File]",
    };

    const previewText = messageContent || (firstMedia ? mediaLabel[firstMedia.Type] || "[Media]" : "No messages yet");

    return (
        <button
            type="button"
            onClick={() => onSelect?.(item)}
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
                {isUnread ? (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                ) : (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <span className={cn(
                        "truncate text-sm font-medium text-foreground/80",
                        isUnread && "font-bold text-foreground",
                    )}>
                        {title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        {isPinned && (
                            <Pin className="h-3 w-3 text-muted-foreground" />
                        )}
                        {isMuted && (
                            <BellOff className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                            {lastMessage ? toRelativeTime(lastMessage.DateCreated) : ""}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className={cn(
                        "truncate text-xs",
                        isUnread ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}>
                        {previewText !== "No messages yet" ? (
                            isCurrentUserSender ? (
                                <>
                                    <span className="font-medium">You:</span>
                                    {" "}
                                    {previewText}
                                </>
                            ) : (
                                previewText
                            )
                        ) : (
                            "No messages yet"
                        )}
                    </p>
                </div>
            </div>
        </button>
    );
}
