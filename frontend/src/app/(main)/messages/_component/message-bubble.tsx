"use client";

import { useState } from "react";
import { Message, MediaType, ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toRelativeTime, getInitials, getMediaUrl } from "@/features/messages/utils/message-service.helper";
import { Check, CheckCheck, FileIcon } from "lucide-react";
import { MediaLightbox } from "./media-lightbox";

interface MessageBubbleProps {
    message: Message;
    sender: ProfileSummary;
    isMine: boolean;
    currentProfileId: string;
    showAvatar: boolean;
    /** Messenger-style: "seen" | "sent" | undefined (no status) */
    messageStatus?: "seen" | "sent";
}

function MediaAttachment({
    media,
    onClick,
}: {
    media: Message["Medias"][number];
    onClick?: () => void;
}) {
    const url = getMediaUrl(media.MediaName);

    if (media.Type === MediaType.Image) {
        return (
            <button type="button" onClick={onClick} className="block w-full text-left">
                <img
                    src={url}
                    alt={media.MediaName}
                    className="max-h-60 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                />
            </button>
        );
    }

    if (media.Type === MediaType.Video) {
        return (
            <video
                controls
                className="max-h-60 max-w-full rounded-lg"
                preload="metadata"
                onDoubleClick={onClick}
            >
                <source src={url} />
                Your browser does not support the video tag.
            </video>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 hover:bg-background transition-colors"
        >
            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs truncate">{media.MediaName}</span>
        </a>
    );
}

export function MessageBubble({
    message,
    sender,
    isMine,
    showAvatar,
    messageStatus,
}: MessageBubbleProps) {
    const hasMedias = message.Medias && message.Medias.length > 0;
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    return (
        <>
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

                <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>

                    {/* Media — wider than text bubble, no background/padding */}
                    {hasMedias && (
                        <div className="flex max-w-[85%] flex-col gap-1">
                            {message.Medias.map((media, idx) => (
                                <MediaAttachment
                                    key={media.Id}
                                    media={media}
                                    onClick={
                                        media.Type !== MediaType.File
                                            ? () => openLightbox(idx)
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* Text bubble — only when there's content */}
                    {message.Content && (
                        <div
                            className={cn(
                                "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed overflow-hidden",
                                isMine
                                    ? "rounded-br-sm bg-primary text-primary-foreground"
                                    : "rounded-bl-sm bg-muted text-foreground",
                            )}
                        >
                            {message.Content}
                        </div>
                    )}

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

            {hasMedias && lightboxIndex !== null && (
                <MediaLightbox
                    medias={message.Medias}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onPrev={
                        lightboxIndex > 0
                            ? () => setLightboxIndex(lightboxIndex - 1)
                            : undefined
                    }
                    onNext={
                        lightboxIndex < message.Medias.length - 1
                            ? () => setLightboxIndex(lightboxIndex + 1)
                            : undefined
                    }
                />
            )}
        </>
    );
}
