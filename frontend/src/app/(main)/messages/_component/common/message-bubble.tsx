"use client";

import { useState } from "react";
import { Message, MediaType, ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toRelativeTime, getInitials, getMediaUrl } from "@/features/messages/utils/message-service.helper";
import { Check, CheckCheck, FileIcon, Download, FileText, FileArchive } from "lucide-react";
import { MediaLightbox } from "./media-lightbox";

interface MessageBubbleProps {
    message: Message;
    sender: ProfileSummary;
    isMine: boolean;
    currentProfileId: string;
    showAvatar: boolean;
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
                    className="max-h-64 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                    loading="lazy"
                />
            </button>
        );
    }

    if (media.Type === MediaType.Video) {
        return (
            <video
                controls
                className="max-h-64 max-w-full rounded-lg shadow-sm"
                preload="metadata"
                onDoubleClick={onClick}
            >
                <source src={url} />
                Your browser does not support the video tag.
            </video>
        );
    }

    const ext = media.MediaName.split(".").pop()?.toUpperCase() ?? "FILE";
    const isArchive = /\.(zip|rar|7z|tar|gz)$/i.test(media.MediaName);

    return (
        <a
            href={url}
            download={media.MediaName}
            className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 hover:bg-accent/40 transition-colors shadow-sm border border-border/40 group/file"
        >
            <div className="shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                {isArchive
                    ? <FileArchive className="h-5 w-5 text-primary" />
                    : <FileText className="h-5 w-5 text-primary" />
                }
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{media.MediaName}</p>
                <p className="text-[10px] text-muted-foreground">
                    {ext} file · Click to download
                </p>
            </div>
            <Download className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover/file:opacity-100 transition-opacity" />
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
            <div className={cn(
                "flex items-end gap-2 px-1",
                isMine ? "flex-row-reverse" : "flex-row",
            )}>
                {!isMine && (
                    <div className="w-7 shrink-0 self-end mb-1">
                        {showAvatar && (
                            <Avatar className="h-7 w-7 ring-1 ring-border/50">
                                <AvatarImage src={sender.AvatarUrl ?? undefined} alt={sender.FullName} />
                                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                    {getInitials(sender.FullName)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                )}

                <div className={cn("flex flex-col gap-1", isMine ? "items-end max-w-[65%]" : "items-start max-w-[65%]")}>
                    {/* Media */}
                    {hasMedias && (
                        <div className="flex max-w-[90%] flex-col gap-1.5">
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

                    {/* Text bubble */}
                    {message.Content && (
                        <div
                            className={cn(
                                "rounded-lg px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm",
                                isMine
                                    ? "rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_2px_6px_rgba(99,102,241,0.25)]"
                                    : "rounded-bl-md bg-card border border-border/40 text-foreground",
                            )}
                        >
                            {message.Content}
                        </div>
                    )}

                    {/* Status */}
                    {messageStatus && (
                        <div className="flex items-center gap-1 px-1.5">
                            {messageStatus === "seen" ? (
                                <>
                                    <CheckCheck className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Seen · {toRelativeTime(message.DateCreated)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="text-[10px] font-medium text-muted-foreground">
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
