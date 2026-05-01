"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PersonalChatActionMenu } from "./personal-chat-action-menu";
import { Chat } from "@/features/messages/types/contracts";
import { getProfileId, getTitle, getAvatarUrl, getInitials } from "@/features/messages/utils/message-service.helper";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface PersonalChatHeaderProps {
    detail: Chat;
    onBack?: () => void;
}

export function PersonalChatHeader({ detail, onBack }: PersonalChatHeaderProps) {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const title = getTitle(detail, currentProfileId);
    const avatarUrl = getAvatarUrl(detail, currentProfileId);
    const isRequest = detail?.ChatSettings?.find(
        (s) => s.ProfileId === currentProfileId
    )?.IsRequested ?? detail?.ChatSettings?.[0]?.IsRequested;

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

            <PersonalChatActionMenu chat={detail} onBack={onBack} />
        </header>
    );
}
