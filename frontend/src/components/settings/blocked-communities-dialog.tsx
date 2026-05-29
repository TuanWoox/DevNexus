"use client";

import { useState } from "react";
import { Ban, Building2, Loader2, Lock, RotateCcw, Search, Users, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import {
    blockedCommunityIdOf,
    blockedCommunityOf,
    communityBlockIdOf,
    useUnblockCommunity,
} from "@/hooks/profile-community-block-hooks/use-unblock-community";
import { useGetMyBlockedCommunitiesInfinite } from "@/hooks/profile-community-block-hooks/use-get-my-blocked-communities-infinite";
import { cn } from "@/lib/utils";

interface BlockedCommunitiesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatMemberCount(count?: number | null) {
    if (typeof count !== "number") return null;
    return `${count.toLocaleString()} ${count === 1 ? "member" : "members"}`;
}

export function BlockedCommunitiesDialog({ open, onOpenChange }: BlockedCommunitiesDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const {
        data: blockData,
        isLoading,
        isError,
        refetch,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useGetMyBlockedCommunitiesInfinite(debouncedSearchTerm, open);

    const unblockMutation = useUnblockCommunity();
    const pendingBlockId = unblockMutation.variables?.blockId;

    const normalizedSearchTerm = debouncedSearchTerm.trim().toLowerCase();
    const blocks = blockData?.pages?.flatMap((page) => page?.data ?? []) ?? [];
    const visibleBlocks = normalizedSearchTerm
        ? blocks.filter((block) => {
            const community = blockedCommunityOf(block);
            const searchableText = [
                community?.name,
                community?.slug,
                community?.id,
                blockedCommunityIdOf(block),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedSearchTerm);
        })
        : blocks;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSearchTerm("");
        }
        onOpenChange(nextOpen);
    };

    const sentinelRef = useIntersectionObserver(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    });

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl font-semibold">Manage blocked communities</DialogTitle>
                            <DialogDescription>
                                Review communities you have blocked and unblock them when needed.
                            </DialogDescription>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full cursor-pointer"
                            onClick={() => handleOpenChange(false)}
                            aria-label="Close blocked communities dialog"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search blocked communities..."
                        className="pl-9"
                    />
                </div>

                <div className="min-h-64 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex min-h-48 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                            <div className="rounded-full bg-destructive/10 p-4 text-destructive">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Could not load blocked communities</p>
                                <p className="mt-1 text-sm text-muted-foreground">Try again to refresh the list.</p>
                            </div>
                            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                                {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                Retry
                            </Button>
                        </div>
                    ) : visibleBlocks.length === 0 ? (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                            <div className="rounded-full bg-muted p-4 text-muted-foreground">
                                <Ban className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-foreground">
                                {normalizedSearchTerm ? "No blocked communities found." : "You haven't blocked any communities."}
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {normalizedSearchTerm
                                    ? "Try another community name."
                                    : "Communities you block will appear here so you can manage them later."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visibleBlocks.map((block) => {
                                const blockId = communityBlockIdOf(block);
                                const communityId = blockedCommunityIdOf(block);
                                const community = blockedCommunityOf(block);
                                // const memberCount = formatMemberCount(community?.memberCount);
                                const isPending = unblockMutation.isPending && pendingBlockId === blockId;

                                return (
                                    <div
                                        key={blockId}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-3xs transition-all duration-200 hover:border-primary/25 hover:bg-muted/30 hover:shadow-2xs",
                                            isPending && "opacity-70"
                                        )}
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                                {community?.communityCoverPhotoUrl ? (
                                                    <Image
                                                        src={community.communityCoverPhotoUrl}
                                                        alt=""
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center text-muted-foreground">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <p className="truncate font-semibold text-foreground">
                                                        {community?.name || "Unavailable community"}
                                                    </p>
                                                    {community?.isPrivate ? (
                                                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    ) : null}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="truncate font-mono">
                                                        c/{community?.slug || community?.id || communityId}
                                                    </span>
                                                    {/* {memberCount ? (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {memberCount}
                                                        </span>
                                                    ) : null} */}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="shrink-0 cursor-pointer"
                                            disabled={isPending || !blockId}
                                            onClick={() => unblockMutation.mutate({ blockId, communityId })}
                                        >
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Unblock
                                        </Button>
                                    </div>
                                );
                            })}
                            <div ref={sentinelRef} className="h-2" />
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
