"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/message/message-bubble";
import { TypingIndicator } from "@/components/message/typing-indicator";
import { Message } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
    messages: Message[];
    currentProfileId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onEdit: (message: Message) => void;
    chatId: string;
    isGroup: boolean;
}

export function MessageThread({
    messages,
    currentProfileId,
    onLoadMore,
    hasMore,
    isLoadingMore,
    onEdit,
    chatId,
    isGroup,
}: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef(0);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        if (isLoadingMore) {
            prevScrollHeightRef.current = el.scrollHeight;
        } else {
            const diff = el.scrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                el.scrollTop += diff;
            }
        }
    }, [messages, isLoadingMore]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const scrolledToTop = Math.abs(el.scrollTop) + el.clientHeight >= el.scrollHeight - 100;
        if (scrolledToTop && hasMore && !isLoadingMore) {
            onLoadMore?.();
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No messages yet — say hello! 👋
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex h-full flex-col-reverse overflow-y-auto px-2 py-3 sm:px-4"
        >
            <TypingIndicator chatId={chatId} isGroup={isGroup} />

            <div ref={bottomRef} />

            {(() => {
                const lastOwnMessageId = messages.find((m) => m.SenderId === currentProfileId)?.Id;

                return messages.map((message, idx) => {
                    const prev: Message | undefined = messages[idx - 1];

                    const sender = message.Sender ?? {
                        Id: message.SenderId,
                        FullName: "Unknown",
                        AvatarUrl: null,
                    };

                    const isMine = message.SenderId === currentProfileId;
                    const isLastInGroup = idx === 0;
                    const senderChanged = prev && prev.SenderId !== message.SenderId;
                    const isLastOwn = message.Id === lastOwnMessageId;

                    return (
                        <div key={message.Id} className={cn("py-0.5", senderChanged && "mt-3")}>
                            <MessageBubble
                                message={message}
                                sender={sender}
                                isMine={isMine}
                                currentProfileId={currentProfileId}
                                showAvatar={isLastInGroup}
                                isLastOwn={isLastOwn}
                                onEdit={onEdit}
                            />
                        </div>
                    );
                });
            })()}

            {isLoadingMore && (
                <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
}
