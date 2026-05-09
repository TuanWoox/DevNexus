"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMessageReaders } from "@/features/messages/hooks/messages/use-message-readers";
import { toRelativeTime, getInitials } from "@/features/messages/utils/message-service.helper";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

interface ReadReceiptOverlayProps {
    messageId: number;
    open: boolean;
    onClose: () => void;
}

export function ReadReceiptOverlay({ messageId, open, onClose }: ReadReceiptOverlayProps) {
    const { readers, isLoading, hasMore, loadMore, isFetchingMore } = useMessageReaders(messageId, 30);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        if (nearBottom && hasMore && !isFetchingMore) {
            loadMore();
        }
    }, [hasMore, isFetchingMore, loadMore]);

    useEffect(() => {
        if (!open) return;
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [open, handleScroll]);

    return (
        <Sheet open={open} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
            <SheetContent className="max-w-sm w-full flex flex-col">
                <SheetHeader>
                    <SheetTitle className="text-sm">Seen by</SheetTitle>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : readers.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                        No readers yet
                    </p>
                ) : (
                    <div
                        ref={scrollRef}
                        className="flex flex-col gap-3 overflow-y-auto flex-1 -mx-6 px-6"
                    >
                        {readers.map((r) => (
                            <div key={r.ReaderId} className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={r.Reader?.AvatarUrl ?? undefined} alt={r.Reader?.FullName ?? "Unknown"} />
                                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                        {getInitials(r.Reader?.FullName ?? "?")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {r.Reader?.FullName ?? "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {toRelativeTime(r.ReadAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isFetchingMore && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
