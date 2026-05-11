'use client';

import { useCallback } from 'react';
import { Loader2 } from "lucide-react";
import { PostCard } from "./post-card";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface PostListViewProps {
    title?: string;
    subtitle?: string;
    posts: (SelectPostDTO | SelectQAPostDTO)[] | undefined;
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

export function PostListView({
    title,
    subtitle,
    posts,
    isLoading,
    isError,
    isFetchingNextPage = false,
    hasNextPage = false,
    onLoadMore,
    loadingText = "Loading posts...",
    errorText = "Failed to load posts. Please try again.",
    emptyTitle = "No posts yet",
    emptySubtitle = "Check back later or create a new post to get started.",
}: PostListViewProps) {
    const handleIntersect = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const sentinelRef = useIntersectionObserver(handleIntersect);

    return (
        <div className="w-full mx-auto py-4 sm:p-6">
            {(title || subtitle) && (
                <div className="mb-6 px-4 sm:px-0">
                    {title && <h1 className="text-2xl font-bold text-heading">{title}</h1>}
                    {subtitle && <p className="text-base text-muted-foreground mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="flex flex-col gap-4 px-4 sm:px-0">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium animate-pulse">{loadingText}</p>
                    </div>
                )}

                {isError && (
                    <div className="card p-6 text-center border-destructive">
                        <p className="text-destructive font-medium">{errorText}</p>
                    </div>
                )}

                {!isLoading && !isError && posts && posts.length === 0 && (
                    <div className="card p-10 text-center flex flex-col items-center justify-center fade-in">
                        <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mb-4">
                            <span className="text-2xl">📭</span>
                        </div>
                        <h3 className="text-lg font-bold text-heading">{emptyTitle}</h3>
                        <p className="text-muted-foreground mt-2">{emptySubtitle}</p>
                    </div>
                )}

                {!isLoading && !isError && posts?.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Sentinel: khi div này vào viewport, tự động load trang tiếp theo */}
                {!isLoading && !isError && posts && posts.length > 0 && (
                    <div ref={sentinelRef} className="h-4" />
                )}

                {/* Spinner khi đang fetch trang tiếp theo */}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {/* End of list indicator */}
                {!isLoading && !hasNextPage && posts && posts.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        You&apos;ve reached the end
                    </p>
                )}
            </div>
        </div>
    );
}
