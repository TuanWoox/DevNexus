"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMessageEditHistory } from "@/features/messages/hooks/messages/use-message-edit-history";
import { toRelativeTime } from "@/features/messages/utils/message-service.helper";

interface Props {
    messageId: number;
    open: boolean;
    onClose: () => void;
}

export function MessageEditHistoryOverlay({ messageId, open, onClose }: Props) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessageEditHistory(messageId, open);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
            { threshold: 0.1 }
        );
        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const history = data?.pages.flatMap(p => p.result?.data ?? []) ?? [];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md max-h-[60vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit History</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 pr-1">
                    {history.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
                    ) : (
                        history.map((entry) => (
                            <div key={entry.Id} className="flex flex-col gap-0.5 rounded-lg border border-border/40 px-3 py-2">
                                <p className="text-sm text-foreground">{entry.Content}</p>
                                <span className="text-[10px] text-muted-foreground">
                                    {toRelativeTime(entry.EditedAt)}
                                </span>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                    {isFetchingNextPage && (
                        <p className="text-xs text-muted-foreground text-center">Loading...</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
