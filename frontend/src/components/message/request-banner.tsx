"use client";

import { useRouter } from "next/navigation";
import { UserPlus, Archive, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getTitle, getAvatarUrl } from "@/features/messages/utils/message-service.helper";
import { useUpdateChatSetting } from "@/features/messages/hooks/chatsettings/use-update-chat-setting";
import type { Chat } from "@/features/messages/types/contracts";

interface Props {
    chat: Chat;
    currentProfileId: string;
}

export function RequestBanner({ chat, currentProfileId }: Props) {
    const router = useRouter();
    const updateSetting = useUpdateChatSetting();
    const setting = chat.ChatSettings?.[0];

    if (!setting?.IsRequested) return null;

    const title = getTitle(chat, currentProfileId);
    const avatarUrl = getAvatarUrl(chat, currentProfileId);
    const isPending = updateSetting.isPending;

    const handleAccept = () => {
        updateSetting.mutate({
            Id: setting.Id,
            IsRequested: false,
            IsArchived: false,
            IsMuted: null,
            IsPinned: null,
            MuteUntil: null,
        });
    };

    const handleArchive = () => {
        updateSetting.mutate(
            {
                Id: setting.Id,
                IsArchived: true,
                IsRequested: null,
                IsMuted: null,
                IsPinned: null,
                MuteUntil: null,
            },
            { onSuccess: () => router.push("/messages") }
        );
    };

    return (
        <div className="flex flex-col items-center gap-4 px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex flex-col items-center gap-2 text-center">
                <UserAvatar avatarUrl={avatarUrl} fullName={title} className="h-14 w-14 ring-2 ring-border/50" />
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        {chat.IsGroup ? "Group message request" : "Message request"}
                    </p>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-xs">
                {chat.IsGroup
                    ? "You were added to this group. Accept to join the conversation."
                    : "This person wants to send you a message. You won't be connected until you accept."}
            </p>

            <div className="flex items-center gap-2 w-full max-w-xs">
                <Button
                    onClick={handleAccept}
                    disabled={isPending}
                    className="flex-1 h-9 text-sm"
                >
                    {isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><UserPlus className="h-4 w-4 mr-1.5" />Accept</>
                    }
                </Button>
                <Button
                    onClick={handleArchive}
                    disabled={isPending}
                    variant="outline"
                    className="flex-1 h-9 text-sm"
                >
                    <Archive className="h-4 w-4 mr-1.5" />Archive
                </Button>
            </div>
        </div>
    );
}
