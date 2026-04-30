import { Message, ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toRelativeTime, getInitials } from "@/features/messages/utils/message-service.helper";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
    message: Message;
    sender: ProfileSummary;
    isMine: boolean;
    currentProfileId: string;
    showAvatar: boolean;
    /** Messenger-style: "seen" | "sent" | undefined (no status) */
    messageStatus?: "seen" | "sent";
}

export function MessageBubble({
    message,
    sender,
    isMine,
    showAvatar,
    messageStatus,
}: MessageBubbleProps) {
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

                {/* Messenger-style: only the last message shows status */}
                {messageStatus && (
                    <div className="flex items-center gap-1 px-1">
                        {messageStatus === "seen" ? (
                            <>
                                <CheckCheck className="h-3 w-3 text-primary" />
                                <span className="text-[10px] text-muted-foreground">
                                    Seen · {toRelativeTime(message.DateCreated)}
                                </span>
                            </>
                        ) : (
                            <>
                                <Check className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                    {toRelativeTime(message.DateCreated) === "now"
                                        ? "Sent"
                                        : `Sent · ${toRelativeTime(message.DateCreated)}`}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
