"use client";

import { useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMediaUrl } from "@/services/content-media-service";
import { ContentType } from "@/types/content-media/content-type";

interface CollectionPreviewImageProps {
    previewImageMediaId?: string | null;
    previewImageContentType?: ContentType | null;
    isActive?: boolean;
}

export const CollectionPreviewImage = ({
    previewImageMediaId,
    previewImageContentType,
    isActive = false,
}: CollectionPreviewImageProps) => {
    const [hasImageError, setHasImageError] = useState(false);

    const imageUrl = useMemo(() => {
        if (!previewImageMediaId || previewImageContentType === null || previewImageContentType === undefined) {
            return null;
        }

        return buildMediaUrl(previewImageMediaId, previewImageContentType);
    }, [previewImageMediaId, previewImageContentType]);

    const shouldShowImage = imageUrl && !hasImageError;

    return (
        <span
            className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
                isActive ? "border-primary/40 ring-1 ring-primary/30" : "border-border"
            )}
        >
            {shouldShowImage ? (
                <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setHasImageError(true)}
                />
            ) : (
                <Bookmark
                    className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}
                />
            )}
        </span>
    );
};
