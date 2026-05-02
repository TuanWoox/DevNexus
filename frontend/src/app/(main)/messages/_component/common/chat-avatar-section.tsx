"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chat } from "@/features/messages/types/contracts";
import { getAvatarUrl, getTitle, getInitials } from "@/features/messages/utils/message-service.helper";
import { cn } from "@/lib/utils";

interface ChatAvatarSectionProps {
    chat: Chat;
    currentProfileId: string;
}

export function ChatAvatarSection({ chat, currentProfileId }: ChatAvatarSectionProps) {
    const title = getTitle(chat, currentProfileId);
    const avatarUrl = getAvatarUrl(chat, currentProfileId);
    const memberCount = chat.Members?.length ?? 0;
    const isRequest = chat?.ChatSettings?.find(
        (s) => s.ProfileId === currentProfileId
    )?.IsRequested ?? chat?.ChatSettings?.[0]?.IsRequested;

    return (
        <div className="flex flex-col items-center gap-3 py-6 px-4">
            <div className="relative shrink-0">
                <Avatar className="h-24 w-24 ring-4 ring-border/30 shadow-card">
                    <AvatarImage src={avatarUrl} alt={title} />
                    <AvatarFallback className="bg-linear-to-br from-brand-400 to-brand-600 text-white text-2xl font-bold">
                        {getInitials(title)}
                    </AvatarFallback>
                </Avatar>
                <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card",
                    isRequest ? "bg-amber-400" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                )} />
            </div>

            <div className="text-center">
                <p className="text-base font-bold text-foreground tracking-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {chat.IsGroup ? (
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </span>
                    ) : isRequest ? (
                        "Message request"
                    ) : (
                        "Active now"
                    )}
                </p>
            </div>
        </div>
    );
}
