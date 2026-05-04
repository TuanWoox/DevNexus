"use client";

import { X, Minus, Maximize2, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/features/messages/utils/message-service.helper";
import type { Chat } from "@/features/messages/types/contracts";

interface Props {
    title: string;
    avatarUrl?: string;
    chat: Chat;
    onMinimize: () => void;
    onExpand: () => void;
    onClose: () => void;
    onToggleDetail: () => void;
    detailOpen: boolean;
}

export function ChatPopupHeader({ title, avatarUrl, chat, onMinimize, onExpand, onClose, onToggleDetail, detailOpen }: Props) {
    const isGroup = chat.IsGroup;

    return (
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-muted/60 backdrop-blur-sm border-b border-border shrink-0">
            {/* Avatar + Name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-sm">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {getInitials(title)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        {isGroup ? "Group chat" : "Active"}
                    </p>
                </div>
            </div>

            {/* Detail toggle */}
            <button
                onClick={onToggleDetail}
                className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${detailOpen ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
                aria-label="Chat details"
            >
                <Info className="h-4 w-4" />
            </button>

            {/* Window controls */}
            <div className="flex items-center gap-0.5 shrink-0">
                <button
                    onClick={onExpand}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Expand to full"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={onMinimize}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Minimize"
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={onClose}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    aria-label="Close"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
