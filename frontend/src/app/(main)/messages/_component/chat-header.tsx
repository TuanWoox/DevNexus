"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatDetailData } from "@/features/messages/types/contracts";
import { ChatActionMenu } from "@/app/(main)/messages/_component/chat-action-menu";

interface ChatHeaderProps {
    detail: ChatDetailData;
    onToggleArchive: () => void;
    onTogglePin: () => void;
    onToggleMute: () => void;
    onClearMessages: () => void;
    onAcceptRequest: () => void;
    onBack?: () => void;
}

function getTitle(detail: ChatDetailData): string {
    if (detail.Chat.IsGroup) return detail.Chat.Name || "Group Chat";
    return detail.Participants[0]?.FullName || detail.Chat.Name || "Conversation";
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function ChatHeader({
    detail,
    onToggleArchive,
    onTogglePin,
    onToggleMute,
    onClearMessages,
    onAcceptRequest,
    onBack,
}: ChatHeaderProps) {
    const title = getTitle(detail);
    const avatarUrl = detail.Participants[0]?.AvatarUrl ?? detail.Chat.ChatPictureUrl ?? undefined;
    const isRequest = detail.CurrentSetting.IsRequested;

    return (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card">
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Back to inbox"
                    className="shrink-0 md:hidden"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}

            <div className="flex flex-1 min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={title} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(title)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">
                        {isRequest ? "Message request" : "Active now"}
                    </p>
                </div>
            </div>

            <ChatActionMenu
                setting={detail.CurrentSetting}
                onToggleArchive={onToggleArchive}
                onTogglePin={onTogglePin}
                onToggleMute={onToggleMute}
                onClearMessages={onClearMessages}
                onAcceptRequest={onAcceptRequest}
            />
        </header>
    );
}
