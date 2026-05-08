"use client";

import { useMemo, useState } from "react";
import { Message, MediaType, ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toRelativeTime, getInitials, getMediaUrl } from "@/features/messages/utils/message-service.helper";
import { Check, Download, FileText, FileArchive, MoreVertical, Trash2, Pencil } from "lucide-react";
import { MediaLightbox } from "@/components/message/media-lightbox";
import { ReadReceiptOverlay } from "@/components/message/read-receipt-overlay";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteMessage } from "@/features/messages/hooks/messages/use-delete-message";
import { useUndoDeleteMessage } from "@/features/messages/hooks/messages/use-undo-delete-message";
import { MessageEditHistoryOverlay } from "@/components/message/message-edit-history-overlay";

const MAX_VISIBLE_AVATARS = 3;

interface MessageBubbleProps {
    message: Message;
    sender: ProfileSummary;
    isMine: boolean;
    currentProfileId: string;
    showAvatar: boolean;
    isLastOwn: boolean;
    onEdit: (message: Message) => void;
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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

function ReaderAvatars({
    receipts,
    messageId,
}: {
    receipts: Message["ReadReceipts"];
    messageId: number;
}) {
    const [overlayOpen, setOverlayOpen] = useState(false);
    const readers = receipts ?? [];
    const visible = readers.slice(0, MAX_VISIBLE_AVATARS);
    const overflow = readers.length - MAX_VISIBLE_AVATARS;
    const overflowNames = readers.slice(MAX_VISIBLE_AVATARS).map((r) => r.Reader?.FullName ?? "Unknown").join(", ");

    if (readers.length === 0) return null;

    return (
        <>
            <div className="flex items-center gap-1 px-1.5">
                <div className="flex -space-x-1.5">
                    {visible.map((r) => (
                        <Avatar key={r.ReaderId} className="h-4 w-4 ring-1 ring-background" title={r.Reader?.FullName ?? "Unknown"}>
                            <AvatarImage src={r.Reader?.AvatarUrl ?? undefined} alt={r.Reader?.FullName ?? "Unknown"} />
                            <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                                {getInitials(r.Reader?.FullName as string ?? "?")}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {overflow > 0 && (
                        <button
                            type="button"
                            title={overflowNames}
                            onClick={() => setOverlayOpen(true)}
                            className="h-4 w-4 rounded-full bg-muted ring-1 ring-background flex items-center justify-center text-[7px] font-semibold text-muted-foreground hover:bg-accent transition-colors"
                        >
                            +{overflow}
                        </button>
                    )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                    {toRelativeTime(readers[0].ReadAt)}
                </span>
            </div>

            <ReadReceiptOverlay
                messageId={messageId}
                open={overlayOpen}
                onClose={() => setOverlayOpen(false)}
            />
        </>
    );
}

export function MessageBubble({
    message,
    sender,
    isMine,
    showAvatar,
    isLastOwn,
    onEdit,
}: MessageBubbleProps) {
    const hasMedias = message.Medias && message.Medias.length > 0;
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const receipts = message.ReadReceipts ?? [];
    const hasReaders = receipts.length > 0;

    const { mutate: deleteMessage } = useDeleteMessage();
    const { mutate: undoDeleteMessage } = useUndoDeleteMessage();

    const [mountedAt] = useState(() => Date.now());
    const createdAt = new Date(message.DateCreated).getTime();
    const canEdit = useMemo(
        () => mountedAt - createdAt < 5 * 60 * 1000 && !!message.Content,
        [mountedAt, createdAt, message.Content],
    );

    return (
        <>
            <div className={cn(
                "flex items-end gap-1 px-1 group",
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
                    {hasMedias && !message.IsDeleted && (
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

                    {message.IsDeleted ? (
                        <div className={cn(
                            "rounded-lg px-4 py-2.5 text-sm italic shadow-sm",
                            isMine
                                ? "rounded-br-md bg-linear-to-br from-brand-500/60 to-brand-600/60 text-white/80"
                                : "rounded-bl-md bg-card border border-border/40 text-muted-foreground",
                        )}>
                            {message.Content}
                            {isMine && (
                                <button
                                    onClick={() => undoDeleteMessage(message.Id)}
                                    className="underline ml-2 not-italic text-white/90 hover:text-white"
                                >
                                    Undo
                                </button>
                            )}
                        </div>
                    ) : (
                        message.Content && (
                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2.5 text-sm leading-relaxed wrap-break-words shadow-sm",
                                    isMine
                                        ? "rounded-br-md bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-[0_2px_6px_rgba(99,102,241,0.25)]"
                                        : "rounded-bl-md bg-card border border-border/40 text-foreground",
                                )}
                            >
                                {message.Content}
                            </div>
                        )
                    )}

                    {message.IsEdited && !message.IsDeleted && (
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground underline px-1"
                        >
                            (edited)
                        </button>
                    )}

                    {isMine && isLastOwn && (
                        hasReaders ? (
                            <ReaderAvatars receipts={receipts} messageId={message.Id} />
                        ) : (
                            <div className="flex items-center gap-1 px-1.5">
                                <Check className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {toRelativeTime(message.DateCreated) === "now"
                                        ? "Sent"
                                        : `Sent · ${toRelativeTime(message.DateCreated)}`}
                                </span>
                            </div>
                        )
                    )}
                </div>

                {isMine && !message.IsDeleted && (
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-accent transition-colors">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="left" align="center">
                                {canEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(message)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => deleteMessage(message.Id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {message.IsEdited && (
                <MessageEditHistoryOverlay
                    messageId={message.Id}
                    open={historyOpen}
                    onClose={() => setHistoryOpen(false)}
                />
            )}

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
