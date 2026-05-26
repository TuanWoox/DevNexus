"use client";

import { useState } from "react";
import { Ban, Loader2, RotateCcw, Search, UserX, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    blockedProfileIdOf,
    blockIdOf,
    useUnblockProfile,
} from "@/hooks/block-hooks/use-unblock-profile";
import { useGetMyBlocksInfinite } from "@/hooks/block-hooks/use-get-my-blocks-infinite";
import { useDebounce } from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";
import { SelectProfileBlockDTO } from "@/types/profile-block/select-profile-block-dto";

interface BlockedProfilesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const blockedProfileOf = (block: SelectProfileBlockDTO) => block.BlockedProfile ?? block.blockedProfile ?? null;

export function BlockedProfilesModal({ open, onOpenChange }: BlockedProfilesModalProps) {
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
    } = useGetMyBlocksInfinite(debouncedSearchTerm, open);

    const unblockMutation = useUnblockProfile();
    const pendingBlockId = unblockMutation.variables?.blockId;

    const normalizedSearchTerm = debouncedSearchTerm.trim().toLowerCase();
    const blocks = blockData?.pages?.flatMap((page) => page?.data ?? []) ?? [];
    const visibleBlocks = normalizedSearchTerm
        ? blocks.filter((block) => {
            const profile = blockedProfileOf(block);
            const searchableText = [
                profile?.fullName,
                profile?.id,
                blockedProfileIdOf(block),
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
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl font-semibold">Manage blocked profiles</DialogTitle>
                            <DialogDescription>
                                Review profiles you have blocked and unblock them when needed.
                            </DialogDescription>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full cursor-pointer"
                            onClick={() => handleOpenChange(false)}
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
                        placeholder="Search blocked profiles..."
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
                                <UserX className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Could not load blocked profiles</p>
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
                                {normalizedSearchTerm ? "No blocked profiles found." : "You haven't blocked anyone."}
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {normalizedSearchTerm
                                    ? "Try another name."
                                    : "Profiles you block will appear here so you can manage them later."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visibleBlocks.map((block) => {
                                const blockId = blockIdOf(block);
                                const blockedProfileId = blockedProfileIdOf(block);
                                const profile = blockedProfileOf(block);
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
                                            <UserAvatar
                                                avatarUrl={profile?.avatarUrl}
                                                fullName={profile?.fullName}
                                                className="size-11 shrink-0 border border-border"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-foreground">
                                                    {profile?.fullName || "Unavailable profile"}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="shrink-0 cursor-pointer"
                                            disabled={isPending || !blockId}
                                            onClick={() => unblockMutation.mutate({ blockId, blockedProfileId })}
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
