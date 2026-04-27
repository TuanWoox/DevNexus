"use client";

import { useEffect, useMemo, useRef } from "react";
import { MessageBubble } from "@/app/(main)/messages/_component/message-bubble";
import { ChatDetailData, Message } from "@/features/messages/types/contracts";
import { Separator } from "@/components/ui/separator";

interface MessageThreadProps {
    detail: ChatDetailData;
    currentProfileId: string;
}

function isSameDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate();
}

function formatDaySeparator(isoDate: string): string {
    const d = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(isoDate, today.toISOString())) return "Today";
    if (isSameDay(isoDate, yesterday.toISOString())) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function MessageThread({ detail, currentProfileId }: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    const profileLookup = useMemo(() => {
        const map = new Map<string, { Id: string; FullName: string; AvatarUrl: string | null }>();
        map.set(currentProfileId, { Id: currentProfileId, FullName: "You", AvatarUrl: null });
        detail.Participants.forEach((p) => map.set(p.Id, p));
        return map;
    }, [currentProfileId, detail.Participants]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [detail.Messages.length]);

    if (detail.Messages.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No messages yet — say hello! 👋
            </div>
        );
    }

    const messages = detail.Messages;

    return (
        <div className="flex flex-col gap-1 pb-2">
            {messages.map((message, idx) => {
                const prev: Message | undefined = messages[idx - 1];
                const next: Message | undefined = messages[idx + 1];
                const sender = profileLookup.get(message.SenderId) ?? {
                    Id: message.SenderId,
                    FullName: "Unknown",
                    AvatarUrl: null,
                };
                const isMine = message.SenderId === currentProfileId;
                const showDay = !prev || !isSameDay(message.DateCreated, prev.DateCreated);
                const isLastInGroup = !next || next.SenderId !== message.SenderId;
                const senderChanged = prev && prev.SenderId !== message.SenderId;

                return (
                    <div key={message.Id} className={senderChanged ? "mt-3" : ""}>
                        {showDay && (
                            <div className="my-4 flex items-center gap-3">
                                <Separator className="flex-1" />
                                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                    {formatDaySeparator(message.DateCreated)}
                                </span>
                                <Separator className="flex-1" />
                            </div>
                        )}
                        <MessageBubble
                            message={message}
                            sender={sender}
                            isMine={isMine}
                            receipts={detail.Receipts}
                            currentProfileId={currentProfileId}
                            showAvatar={isLastInGroup}
                        />
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
