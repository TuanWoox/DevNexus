"use client";

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { CommunityCard } from "./community-card";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface CommunityListViewProps {
    communities: SelectCommunityDTO[] | undefined;
    isLoading: boolean;
    isError: boolean;
    isFetchingNextPage?: boolean;
    hasNextPage?: boolean;
    onLoadMore?: () => void;
    loadingText?: string;
    errorText?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
}

export function CommunityListView({
    communities,
    isLoading,
    isError,
    isFetchingNextPage = false,
    hasNextPage = false,
    onLoadMore,
    loadingText = "Loading communities...",
    errorText = "Failed to load communities. Please try again.",
    emptyTitle = "No communities yet",
    emptySubtitle = "Check back later or explore other communities.",
}: CommunityListViewProps) {
    const handleIntersect = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const sentinelRef = useIntersectionObserver(handleIntersect);

    return (
        <div className="w-full max-w-7xl mx-auto pb-4">
            <div className="flex flex-col gap-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium animate-pulse">{loadingText}</p>
                    </div>
                )}

                {isError && (
                    <div className="p-6 text-center border border-destructive/20 bg-destructive/10 rounded-xl">
                        <p className="text-destructive font-medium">{errorText}</p>
                    </div>
                )}

                {!isLoading && !isError && communities && communities.length === 0 && (
                    <div className="p-10 text-center flex flex-col items-center justify-center fade-in bg-muted/30 rounded-xl border border-dashed">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <span className="text-2xl">🌍</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{emptyTitle}</h3>
                        <p className="text-muted-foreground mt-2">{emptySubtitle}</p>
                    </div>
                )}

                {!isLoading && !isError && communities && communities.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 fade-in">
                        {communities.map((community) => (
                            <CommunityCard key={community.id} community={community} />
                        ))}
                    </div>
                )}

                {/* Sentinel */}
                {!isLoading && !isError && communities && communities.length > 0 && (
                    <div ref={sentinelRef} className="h-4" />
                )}

                {/* Spinner when fetching next page */}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {/* End of list indicator */}
                {!isLoading && !hasNextPage && communities && communities.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        You&apos;ve reached the end
                    </p>
                )}
            </div>
        </div>
    );
}
