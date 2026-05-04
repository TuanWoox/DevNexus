"use client";

import { ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chat } from "@/features/messages/types/contracts";
import { getProfileId, getTitle, getAvatarUrl, getInitials } from "@/features/messages/utils/message-service.helper";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { cn } from "@/lib/utils";

interface PersonalChatHeaderProps {
    detail: Chat;
    onBack?: () => void;
    onTogglePanel?: () => void;
}

export function PersonalChatHeader({ detail, onBack, onTogglePanel }: PersonalChatHeaderProps) {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const title = getTitle(detail, currentProfileId);
    const avatarUrl = getAvatarUrl(detail, currentProfileId);
    const isRequest = detail?.ChatSettings?.find(
        (s) => s.ProfileId === currentProfileId
    )?.IsRequested ?? detail?.ChatSettings?.[0]?.IsRequested;

    return (
        <header className="flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3">
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Back to inbox"
                    className="shrink-0 md:hidden rounded-lg hover:bg-muted transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}

            <div className="flex flex-1 min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                    <Avatar className="h-11 w-11 ring-2 ring-border/50">
                        <AvatarImage src={avatarUrl} alt={title} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {getInitials(title)}
                        </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                        isRequest ? "bg-amber-400" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                    )} />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground/80">
                        {isRequest ? "Message request" : "Active now"}
                    </p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePanel}
                aria-label="Open chat details"
                className="shrink-0 rounded-lg hover:bg-muted transition-colors"
            >
                <Info className="h-4 w-4" />
            </Button>
        </header>
    );
}
