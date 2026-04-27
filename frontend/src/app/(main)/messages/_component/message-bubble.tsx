import { Message, MessageReadReceipt, ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCheck } from "lucide-react";

interface MessageBubbleProps {
    message: Message;
    sender: ProfileSummary;
    isMine: boolean;
    receipts: MessageReadReceipt[];
    currentProfileId: string;
    showAvatar: boolean;
}

function formatTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function MessageBubble({
    message,
    sender,
    isMine,
    receipts,
    currentProfileId,
    showAvatar,
}: MessageBubbleProps) {
    const readCount = receipts.filter(
        (r) => r.MessageId === message.Id && r.ReaderId !== currentProfileId,
    ).length;

    return (
        <div className={cn("flex items-end gap-2 px-1", isMine ? "flex-row-reverse" : "flex-row")}>
            {!isMine && (
                <div className="w-7 shrink-0 self-end mb-1">
                    {showAvatar && (
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={sender.AvatarUrl ?? undefined} alt={sender.FullName} />
                            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                {getInitials(sender.FullName)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            <div className={cn("flex max-w-[72%] flex-col gap-1", isMine ? "items-end" : "items-start")}>
                {!isMine && showAvatar && (
                    <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                        {sender.FullName}
                    </span>
                )}

                <div
                    className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        isMine
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground",
                    )}
                >
                    {message.Content}
                </div>

                <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-muted-foreground">{formatTime(message.DateCreated)}</span>
                    {isMine && readCount > 0 && (
                        <CheckCheck className="h-3 w-3 text-primary" />
                    )}
                </div>
            </div>
        </div>
    );
}
