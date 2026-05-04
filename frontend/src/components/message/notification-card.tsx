"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/features/messages/utils/message-service.helper";
import type { Message } from "@/features/messages/types/contracts";

const DISMISS_AFTER = 5000;

interface Props {
    item: { message: Message };
    onDismiss: () => void;
    onClick: () => void;
}

export function NotificationCard({ item, onDismiss, onClick }: Props) {
    const { message } = item;
    const senderName = message.Sender?.FullName ?? "Someone";
    const preview = message.IsDeleted
        ? "This message has been deleted"
        : message.Content
            ? (message.Content.length > 60 ? message.Content.slice(0, 60) + "…" : message.Content)
            : "Sent an attachment";

    useEffect(() => {
        const t = setTimeout(onDismiss, DISMISS_AFTER);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div
            onClick={onClick}
            className={cn(
                "pointer-events-auto",
                "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg cursor-pointer",
                "animate-in slide-in-from-left-4 fade-in duration-200",
                "hover:bg-accent transition-colors"
            )}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={message.Sender?.AvatarUrl ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(senderName)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{senderName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
            </div>

            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                aria-label="Dismiss"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
