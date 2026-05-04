"use client";

import { X, Minus, Maximize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/features/messages/utils/message-service.helper";

interface Props {
    title: string;
    avatarUrl?: string;
    onMinimize: () => void;
    onExpand: () => void;
    onClose: () => void;
}

export function ChatPopupHeader({ title, avatarUrl, onMinimize, onExpand, onClose }: Props) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(title)}
                </AvatarFallback>
            </Avatar>

            <p className="flex-1 text-sm font-semibold truncate">{title}</p>

            <button
                onClick={onExpand}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label="Expand to full"
            >
                <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={onMinimize}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label="Minimize"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label="Close"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
