"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/app/(main)/messages/_component/common/message-bubble";
import { Message } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
    messages: Message[];
    currentProfileId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}


export function MessageThread({
    messages,
    currentProfileId,
    onLoadMore,
    hasMore,
    isLoadingMore,
}: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const prevScrollHeightRef = useRef(0);

    // ✅ Preserve scroll position when loading older messages
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        if (isLoadingMore) {
            // Take a snapshot of the current total height before new messages are inserted
            prevScrollHeightRef.current = el.scrollHeight;
        } else {
            // After new messages are inserted, calculate how much taller the content got
            // This equals exactly how far down our previously-viewed content got pushed
            const diff = el.scrollHeight - prevScrollHeightRef.current;

            if (diff > 0) {
                // Shift the viewport down by the same amount so we stay on the same message
                //Scroll top starts from bottom up => so we must add for it not minus because if we minus => we increase the scrolltop instead of keep the same
                el.scrollTop += diff;
            }
        }
    }, [messages, isLoadingMore]);

    // ✅ Auto-scroll ONLY if user is near bottom
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        //Scroll top is how many you scroll          → how far down you've gone so far
        //client height is how many px you can see right now  → the visible window size
        //scroll height is total of px you have      → entire content height (visible + hidden)
        const isNearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;

        if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    // ✅ Load more when scrolling up (because of flex-col-reverse layout)
    // In flex-col-reverse, scrollTop is 0 at visual bottom (newest)
    // and becomes negative as user scrolls up toward older messages.
    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;

        // scrollTop is negative in flex-col-reverse; top of scroll = most negative
        const scrolledToTop =
            Math.abs(el.scrollTop) + el.clientHeight >= el.scrollHeight - 100;

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
            className="flex flex-1 flex-col-reverse overflow-y-auto px-4 py-3"
        >
            {/* 👇 bottom anchor (visually bottom because of reverse) */}
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
                            />
                        </div>
                    );
                });
            })()}

            {/* 👇 loading indicator (appears at top visually) */}
            {isLoadingMore && (
                <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
}