"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, FileIcon } from "lucide-react";
import { Media, MediaType } from "@/features/messages/types/contracts";
import { getMediaUrl } from "@/features/messages/utils/message-service.helper";

interface MediaLightboxProps {
    medias: Media[];
    currentIndex: number;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
}

export function MediaLightbox({ medias, currentIndex, onClose, onPrev, onNext }: MediaLightboxProps) {
    const media = medias[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < medias.length - 1;
    const isMulti = medias.length > 1;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
            if (e.key === "ArrowRight" && hasNext) onNext?.();
        },
        [onClose, onPrev, onNext, hasPrev, hasNext],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [handleKeyDown]);

    if (!media) return null;

    const url = getMediaUrl(media.MediaName);

    const renderMedia = () => {
        if (media.Type === MediaType.Image) {
            return (
                <img
                    src={url}
                    alt={media.MediaName}
                    className="max-h-[70vh] max-w-[75vw] rounded-lg object-contain"
                />
            );
        }

        if (media.Type === MediaType.Video) {
            return (
                <video
                    controls
                    autoPlay
                    className="max-h-[70vh] max-w-[75vw] rounded-lg"
                    src={url}
                />
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 text-white"
            >
                <FileIcon className="h-16 w-16" />
                <span className="text-sm underline">{media.MediaName}</span>
            </a>
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </button>

            {isMulti && (
                <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                    {currentIndex + 1} / {medias.length}
                </div>
            )}

            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    aria-label="Next"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            <div onClick={(e) => e.stopPropagation()}>
                {renderMedia()}
            </div>
        </div>,
        document.body,
    );
}
