"use client";

import { Chat } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle, getInitials, toRelativeTime, getProfileId } from "@/features/messages/utils/message-service.helper";
import { Pin, BellOff, Archive } from "lucide-react";

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
    const isCurrentUserSender = lastMessage?.SenderId === currentProfileId;
    const currentSetting = item?.ChatSettings?.[0];

    const isPinned = currentSetting?.IsPinned;
    const isMuted = currentSetting?.IsMuted;

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
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-medium text-foreground/80">
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
                    <p className="truncate text-xs text-muted-foreground">
                        {messageContent ? (
                            isCurrentUserSender ? (
                                <>
                                    <span className="font-medium">You:</span>
                                    {" "}
                                    {messageContent}
                                </>
                            ) : (
                                messageContent
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