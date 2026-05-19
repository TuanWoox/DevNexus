"use client";

import { useEffect, useMemo, useRef } from "react";
import { Clock3, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownViewer } from "@/components/editor/markdown-viewer";
import { cn } from "@/lib/utils";
import {
    useGetAnswerHistoryInfinite,
    useGetCommentHistoryInfinite,
    useGetPostHistoryInfinite,
    useGetQAPostHistoryInfinite,
} from "@/hooks/history-hooks";
import type {
    AnswerHistoryDTO,
    CommentHistoryDTO,
    PostHistoryDTO,
    QAPostHistoryDTO,
} from "@/types/history";

export type ContentHistoryKind = "post" | "qapost" | "comment" | "answer";

interface ContentHistoryOverlayProps {
    contentId: string;
    type: ContentHistoryKind;
    open: boolean;
    onClose: () => void;
}

type HistoryItem = PostHistoryDTO | QAPostHistoryDTO | CommentHistoryDTO | AnswerHistoryDTO;

function getHistoryTitle(type: ContentHistoryKind) {
    if (type === "qapost") return "Question Edit History";
    return `${type.charAt(0).toUpperCase()}${type.slice(1)} Edit History`;
}

function getContent(history: HistoryItem) {
    return history.content.content;
}

function getTitle(history: HistoryItem) {
    if ("postId" in history || "qaPostId" in history) {
        return history.content.title;
    }

    return undefined;
}

function getTags(history: HistoryItem) {
    if ("postId" in history || "qaPostId" in history) {
        return history.content.tagNames ?? [];
    }

    return [];
}

export function ContentHistoryOverlay({
    contentId,
    type,
    open,
    onClose,
}: ContentHistoryOverlayProps) {
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            {type === "post" && <PostHistoryContent contentId={contentId} type={type} />}
            {type === "qapost" && <QAPostHistoryContent contentId={contentId} type={type} />}
            {type === "comment" && <CommentHistoryContent contentId={contentId} type={type} />}
            {type === "answer" && <AnswerHistoryContent contentId={contentId} type={type} />}
        </Dialog>
    );
}

function PostHistoryContent({ contentId, type }: { contentId: string; type: ContentHistoryKind }) {
    const query = useGetPostHistoryInfinite(contentId);
    return <HistoryContent query={query} type={type} />;
}

function QAPostHistoryContent({ contentId, type }: { contentId: string; type: ContentHistoryKind }) {
    const query = useGetQAPostHistoryInfinite(contentId);
    return <HistoryContent query={query} type={type} />;
}

function CommentHistoryContent({ contentId, type }: { contentId: string; type: ContentHistoryKind }) {
    const query = useGetCommentHistoryInfinite(contentId);
    return <HistoryContent query={query} type={type} />;
}

function AnswerHistoryContent({ contentId, type }: { contentId: string; type: ContentHistoryKind }) {
    const query = useGetAnswerHistoryInfinite(contentId);
    return <HistoryContent query={query} type={type} />;
}

interface HistoryContentProps {
    type: ContentHistoryKind;
    query: {
        data?: {
            pages: Array<{
                data: HistoryItem[];
                page: { totalElements?: number };
            }>;
        };
        fetchNextPage: () => void;
        hasNextPage?: boolean;
        isFetchingNextPage: boolean;
        isLoading: boolean;
        isError: boolean;
    };
}

function HistoryContent({ query, type }: HistoryContentProps) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = query;
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) fetchNextPage();
            },
            { threshold: 0.1 }
        );

        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const history = useMemo(() => {
        return data?.pages.flatMap((page) => page.data) ?? [];
    }, [data]);
    const totalVersions = data?.pages[0]?.page.totalElements ?? 0;

    return (
        <DialogContent className="w-[calc(100vw-1rem)] sm:min-w-[42rem] lg:min-w-[56rem] xl:min-w-[64rem] max-w-5xl max-h-[85vh] flex flex-col border bg-popover p-0 shadow-elevated overflow-hidden">
            <DialogHeader className="border-b bg-card px-5 py-4 pr-10">
                <DialogTitle className="text-heading flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-primary/10 text-primary shadow-sm">
                        <History className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                        <span className="text-lg font-semibold">{getHistoryTitle(type)}</span>
                        <span className="text-xs font-medium text-muted-foreground">
                            Newest revisions first
                        </span>
                    </span>
                    {totalVersions > 0 && (
                        <Badge variant="outline" className="ml-auto mr-2 bg-muted/40 text-muted-foreground">
                            {totalVersions} revisions
                        </Badge>
                    )}
                </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto bg-background/60 px-4 py-4 sm:px-6">
                {isLoading && (
                    <div className="space-y-4">
                        {[0, 1, 2].map((item) => (
                            <Card key={item} className="p-4 shadow-sm">
                                <Skeleton className="mb-3 h-3 w-32" />
                                <Skeleton className="mb-2 h-4 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                            </Card>
                        ))}
                    </div>
                )}

                {isError && (
                    <p className="text-sm text-destructive text-center py-8">Failed to load history.</p>
                )}

                {!isLoading && !isError && history.length === 0 && (
                    <Card className="border-dashed bg-card px-4 py-10 text-center shadow-sm">
                        <span className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <History className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-medium text-heading">No history available</p>
                        <p className="text-xs text-muted-foreground mt-1">Revisions show here after edits are saved.</p>
                    </Card>
                )}

                <div className="relative flex flex-col gap-5">
                    {history.map((entry, index) => {
                        const title = getTitle(entry);
                        const tags = getTags(entry);
                        const isCurrent = index === 0;

                        return (
                            <Card
                                key={entry.id}
                                className={cn(
                                    "relative ml-4 gap-0 py-0 shadow-sm overflow-visible transition-colors",
                                    isCurrent && "border-primary/30 shadow-primary/10"
                                )}
                            >
                                {index < history.length - 1 && (
                                    <span className="absolute -left-4 top-6 h-[calc(100%+1.25rem)] w-px bg-border" />
                                )}
                                <span
                                    className={cn(
                                        "absolute -left-[21px] top-5 h-3.5 w-3.5 rounded-full border-2 bg-background",
                                        isCurrent ? "border-primary shadow-primary" : "border-muted-foreground/40"
                                    )}
                                />

                                <CardHeader className="px-4 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={isCurrent ? "default" : "secondary"}
                                                className={cn(
                                                    isCurrent
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                Revision {totalVersions - index}
                                            </Badge>
                                            {isCurrent && (
                                                <Badge variant="outline" className="bg-background text-muted-foreground">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {new Date(entry.dateCreated).toLocaleString()}
                                        </span>
                                    </div>

                                    {title && (
                                        <CardTitle className="text-base font-semibold leading-snug text-heading sm:text-lg">
                                            {title}
                                        </CardTitle>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-4 px-4 pb-4">
                                    <div className="max-h-[18rem] overflow-y-auto overscroll-contain rounded-lg border bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-inner sm:max-h-[26rem]">
                                        <MarkdownViewer source={getContent(entry)} />
                                    </div>

                                    {tags.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="flex flex-wrap gap-1.5">
                                                {tags.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="border-ai text-emerald-500">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div ref={bottomRef} className="h-2" />
                {isFetchingNextPage && (
                    <p className="text-xs text-muted-foreground text-center py-3">Loading more...</p>
                )}
            </div>
        </DialogContent>
    );
}
