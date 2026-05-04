"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ImageIcon, VideoIcon, FileIcon, FileText, FileArchive, Download, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatMediaFlat } from "@/features/messages/hooks/messages/use-chat-media";
import { MediaType, Media } from "@/features/messages/types/contracts";
import { getMediaUrl } from "@/features/messages/utils/message-service.helper";
import { MediaLightbox } from "./media-lightbox";

interface MediaSectionProps {
    chatId: string;
}

const tabs = [
    { id: MediaType.Image, label: "Images", icon: ImageIcon },
    { id: MediaType.Video, label: "Videos", icon: VideoIcon },
    { id: MediaType.File, label: "Files", icon: FileIcon },
] as const;

function MediaSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-1.5 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg skeleton" />
            ))}
        </div>
    );
}

function ImageGrid({ media }: { media: Media[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (media.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs">No images shared yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-1.5 px-4">
                {media.map((m, idx) => (
                    <button
                        key={m.Id}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/30 cursor-pointer group relative"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getMediaUrl(m.MediaName)}
                            alt={m.MediaName}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </button>
                ))}
            </div>

            {lightboxIndex !== null && (
                <MediaLightbox
                    medias={media}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
                    onNext={lightboxIndex < media.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
                />
            )}
        </>
    );
}

function VideoGrid({ media }: { media: Media[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (media.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <VideoIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs">No videos shared yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-1.5 px-4">
                {media.map((m, idx) => (
                    <button
                        key={m.Id}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/30 cursor-pointer group relative"
                    >
                        <video
                            src={getMediaUrl(m.MediaName)}
                            className="h-full w-full object-cover"
                            preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-200">
                            <Play className="h-8 w-8 text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                ))}
            </div>

            {lightboxIndex !== null && (
                <MediaLightbox
                    medias={media}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
                    onNext={lightboxIndex < media.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
                />
            )}
        </>
    );
}

function FileList({ media }: { media: Media[] }) {
    if (media.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <FileIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs">No files shared yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 px-4">
            {media.map((m) => {
                const url = getMediaUrl(m.MediaName);
                const ext = m.MediaName.split(".").pop()?.toUpperCase() ?? "FILE";
                const isArchive = /\.(zip|rar|7z|tar|gz)$/i.test(m.MediaName);

                return (
                    <a
                        key={m.Id}
                        href={url}
                        download={m.MediaName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/40 transition-colors group/file"
                    >
                        <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {isArchive
                                ? <FileArchive className="h-5 w-5 text-primary" />
                                : <FileText className="h-5 w-5 text-primary" />
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate text-foreground">{m.MediaName}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {ext} file · Click to download
                            </p>
                        </div>
                        <Download className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover/file:opacity-100 transition-opacity" />
                    </a>
                );
            })}
        </div>
    );
}

export function MediaSection({ chatId }: MediaSectionProps) {
    const [activeTab, setActiveTab] = useState<string>(MediaType.Image);
    const { media, isLoading, isFetchingMore, hasMore, loadMore } = useChatMediaFlat(chatId, activeTab);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 150 && hasMore && !isFetchingMore) {
            loadMore();
        }
    }, [hasMore, isFetchingMore, loadMore]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <div className="py-4">
            {/* Tab Bar */}
            <nav className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 mx-4 mb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 cursor-pointer",
                            activeTab === tab.id
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Content */}
            <div ref={scrollRef} className="overflow-y-auto max-h-80">
                {isLoading ? (
                    <MediaSkeleton />
                ) : activeTab === MediaType.Image ? (
                    <ImageGrid media={media} />
                ) : activeTab === MediaType.Video ? (
                    <VideoGrid media={media} />
                ) : (
                    <FileList media={media} />
                )}

                {isFetchingMore && (
                    <div className="flex justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    );
}
