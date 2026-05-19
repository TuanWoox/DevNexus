"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle, getInitials, toRelativeTime, getProfileId } from "@/features/messages/utils/message-service.helper";
import { Archive, Bell, BellOff, Check, Loader2, MoreHorizontal, Pin, Trash2, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateChatSetting } from "@/features/messages/hooks/chatsettings/use-update-chat-setting";
import { useDeleteAllMessages } from "@/features/messages/hooks/chatsettings/use-delete-all-messages";
import { toast } from "sonner";

interface MessageListItemProps {
    item: Chat;
    isActive?: boolean;
    onSelect?: (item: Chat) => void;
}

export function MessageListItem({ item, isActive = false, onSelect }: MessageListItemProps) {
    const router = useRouter();
    const [clearMessagesOpen, setClearMessagesOpen] = useState(false);
    const updateChatSetting = useUpdateChatSetting();
    const deleteAllMessages = useDeleteAllMessages();
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const handleSelect = () => {
        if (onSelect) {
            onSelect(item);
        } else {
            router.push(`/messages/${item.Id}`);
        }
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSelect();
        }
    };
    const title = getTitle(item, currentProfileId);
    const avatarUrl = getAvatarUrl(item, currentProfileId);

    const lastMessage = item.Messages?.[0];
    const isMessageDeleted = lastMessage?.IsDeleted;
    const messageContent = lastMessage?.Content;
    const firstMedia = lastMessage?.Medias?.[0];
    const isCurrentUserSender = lastMessage?.SenderId === currentProfileId;
    const isUnread = lastMessage && lastMessage.SenderId !== currentProfileId && !lastMessage.ReadReceipts?.some((r) => r.ReaderId === currentProfileId);
    const currentSetting = item?.ChatSettings?.[0];

    const isPinned = currentSetting?.IsPinned;
    const isMuted = currentSetting?.IsMuted;
    const canPin = !!currentSetting && !currentSetting.IsArchived && !currentSetting.IsRequested;

    const mediaLabel: Record<string, string> = {
        Image: " Image",
        Video: " Video",
        File: " File",
    };

    const previewText = isMessageDeleted
        ? "Message deleted"
        : messageContent || (firstMedia ? mediaLabel[firstMedia.Type] || " Media" : "No messages yet");

    const handleTogglePin = () => {
        if (!currentSetting || !canPin) return;
        updateChatSetting.mutate({
            Id: currentSetting.Id,
            IsPinned: !currentSetting.IsPinned,
            IsArchived: null,
            IsMuted: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleToggleMute = () => {
        if (!currentSetting) return;
        updateChatSetting.mutate({
            Id: currentSetting.Id,
            IsMuted: !currentSetting.IsMuted,
            IsArchived: null,
            IsPinned: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleToggleArchive = () => {
        if (!currentSetting) return;
        updateChatSetting.mutate({
            Id: currentSetting.Id,
            IsArchived: !currentSetting.IsArchived,
            IsRequested: false,
            IsMuted: null,
            IsPinned: null,
            MuteUntil: null,
        });
    };

    const handleAcceptRequest = () => {
        if (!currentSetting) return;
        updateChatSetting.mutate({
            Id: currentSetting.Id,
            IsRequested: false,
            IsArchived: false,
            IsMuted: null,
            IsPinned: null,
            MuteUntil: null,
        });
    };

    const handleClearMessages = () => {
        if (!currentSetting) return;
        deleteAllMessages.mutate(currentSetting.Id, {
            onSuccess: (data) => {
                if (data.result) {
                    toast.success("Messages cleared");
                    setClearMessagesOpen(false);
                } else {
                    toast.error(data.message ?? "Failed to clear messages");
                }
            },
            onError: () => {
                toast.error("Failed to clear messages");
            },
        });
    };

    return (
        <>
        <div
            role="button"
            tabIndex={0}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150",
                "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                        {currentSetting && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Chat actions"
                                        onClick={(event) => event.stopPropagation()}
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    {canPin && (
                                        <DropdownMenuItem onSelect={handleTogglePin}>
                                            <Pin className="h-4 w-4" />
                                            {currentSetting.IsPinned ? "Unpin chat" : "Pin chat"}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onSelect={handleToggleMute}>
                                        {currentSetting.IsMuted ? (
                                            <Bell className="h-4 w-4" />
                                        ) : (
                                            <BellOff className="h-4 w-4" />
                                        )}
                                        {currentSetting.IsMuted ? "Unmute chat" : "Mute chat"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={handleToggleArchive}>
                                        <Archive className="h-4 w-4" />
                                        {currentSetting.IsArchived ? "Unarchive chat" : "Archive chat"}
                                    </DropdownMenuItem>
                                    {currentSetting.IsRequested && (
                                        <DropdownMenuItem onSelect={handleAcceptRequest}>
                                            <UserPlus className="h-4 w-4" />
                                            Accept request
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setClearMessagesOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Clear messages
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-1 mt-1">
                    <p className={cn(
                        "truncate text-[13px] leading-snug transition-colors",
                        isUnread ? "font-semibold text-foreground/90" : "text-muted-foreground",
                        isMessageDeleted && "italic text-muted-foreground/60"
                    )}>
                        {previewText !== "No messages yet" ? (
                            isCurrentUserSender && !isMessageDeleted ? (
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
        </div>
        {currentSetting && (
            <AlertDialog open={clearMessagesOpen} onOpenChange={setClearMessagesOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear messages?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently clear all messages in this conversation for you.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAllMessages.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearMessages}
                            disabled={deleteAllMessages.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAllMessages.isPending ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : null}
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        </>
    );
}
