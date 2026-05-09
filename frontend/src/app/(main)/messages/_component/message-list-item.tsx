"use client";

import { useRouter } from "next/navigation";
import { Chat } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle, getInitials, toRelativeTime, getProfileId } from "@/features/messages/utils/message-service.helper";
import { Pin, BellOff, Check } from "lucide-react";

interface MessageListItemProps {
    item: Chat;
    isActive?: boolean;
    onSelect?: (item: Chat) => void;
}

export function MessageListItem({ item, isActive = false, onSelect }: MessageListItemProps) {
    const router = useRouter();
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const handleSelect = () => {
        if (onSelect) {
            onSelect(item);
        } else {
            router.push(`/messages/${item.Id}`);
        }
    };
    const title = getTitle(item, currentProfileId);
    const avatarUrl = getAvatarUrl(item, currentProfileId);

    const lastMessage = item.Messages?.[0];
    const messageContent = lastMessage?.Content;
    const firstMedia = lastMessage?.Medias?.[0];
    const isCurrentUserSender = lastMessage?.SenderId === currentProfileId;
    const isUnread = lastMessage && lastMessage.SenderId !== currentProfileId && !lastMessage.ReadReceipts?.some((r) => r.ReaderId === currentProfileId);
    const currentSetting = item?.ChatSettings?.[0];

    const isPinned = currentSetting?.IsPinned;
    const isMuted = currentSetting?.IsMuted;

    const mediaLabel: Record<string, string> = {
        Image: " Image",
        Video: " Video",
        File: " File",
    };

    const previewText = messageContent || (firstMedia ? mediaLabel[firstMedia.Type] || " Media" : "No messages yet");

    return (
        <button
            type="button"
            onClick={handleSelect}
            className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150",
                "hover:bg-accent/40",
                isActive && "bg-accent shadow-sm ring-1 ring-primary/10",
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} alt={title} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {getInitials(title)}
                    </AvatarFallback>
                </Avatar>
                <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                    isUnread ? "bg-primary" : "bg-emerald-500",
                )} />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                    <span className={cn(
                        "truncate text-sm transition-colors duration-200",
                        isUnread ? "font-bold text-foreground" : "font-medium text-foreground/70",
                    )}>
                        {title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        {isPinned && (
                            <Pin className="h-3 w-3 text-amber-500" />
                        )}
                        {isMuted && (
                            <BellOff className="h-3 w-3 text-muted-foreground/60" />
                        )}
                        <span className={cn(
                            "text-[11px] tabular-nums transition-colors",
                            isUnread ? "text-primary font-semibold" : "text-muted-foreground",
                        )}>
                            {lastMessage ? toRelativeTime(lastMessage.DateCreated) : ""}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-1 mt-1">
                    <p className={cn(
                        "truncate text-[13px] leading-snug transition-colors",
                        isUnread ? "font-semibold text-foreground/90" : "text-muted-foreground",
                    )}>
                        {previewText !== "No messages yet" ? (
                            isCurrentUserSender ? (
                                <>
                                    <span className="font-medium text-primary/70">You: </span>
                                    {previewText}
                                </>
                            ) : (
                                previewText
                            )
                        ) : (
                            <span className="italic">No messages yet</span>
                        )}
                    </p>
                    {isUnread && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                    )}
                    {isCurrentUserSender && lastMessage && !isUnread && (
                        (() => {
                            const receipts = lastMessage.ReadReceipts ?? [];
                            const visible = receipts.slice(0, 2);
                            const overflow = receipts.length - 2;
                            if (receipts.length === 0) {
                                return <Check className="h-3 w-3 shrink-0 text-muted-foreground/60" />;
                            }
                            return (
                                <div className="flex -space-x-1 shrink-0">
                                    {visible.map((r) => (
                                        <Avatar key={r.ReaderId} className="h-4 w-4 ring-1 ring-card">
                                            <AvatarImage src={r.Reader?.AvatarUrl ?? undefined} alt={r.Reader?.FullName ?? "Unknown"} />
                                            <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                                                {getInitials(r.Reader?.FullName as string ?? "?")}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {overflow > 0 && (
                                        <span className="h-4 w-4 rounded-full bg-muted ring-1 ring-card flex items-center justify-center text-[7px] font-semibold text-muted-foreground">
                                            +{overflow}
                                        </span>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </button>
    );
}
