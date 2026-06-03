'use client';

import { useCallback } from 'react';
import { Loader2, MessageSquare, Heart } from "lucide-react";
import { PostCard } from "./post-card";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import Link from 'next/link';
import { getPostDetailHref, getQAPostDetailHref } from '@/utils/content-routes';

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
    viewMode?: 'list' | 'grid';
    canModerateCommunity?: boolean;
    isRecommendation?: boolean;
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
    viewMode = 'list',
    canModerateCommunity,
    isRecommendation
}: PostListViewProps) {
    const handleIntersect = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const sentinelRef = useIntersectionObserver(handleIntersect);

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
            {(title || subtitle) && (
                <div className="relative z-10 mb-6 fade-in">
                    <div className="absolute -inset-1 -z-10 rounded-full bg-linear-to-r from-primary to-primary/60 opacity-20 blur-2xl dark:opacity-10" />
                    {title && (
                        <h1 className="mb-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="max-w-2xl text-base text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">{loadingText}</p>
                </div>
            )}

            {isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center shadow-card">
                    <p className="font-medium text-destructive">{errorText}</p>
                </div>
            )}

            {!isLoading && !isError && posts && posts.length === 0 && (
                <div className="fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 p-10 text-center shadow-card">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">
                        <span>📭</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{emptyTitle}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{emptySubtitle}</p>
                </div>
            )}

            {viewMode === 'list' ? (
                <div className="flex flex-col gap-4 sm:gap-5">
                    {posts?.map((post) => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            canModerateCommunity={canModerateCommunity} 
                            isRecommendation={isRecommendation} 
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-6 px-0 sm:px-4">
                    {posts?.map((post) => {
                        const isQaPost = "answerCount" in post;
                        const detailHref = isQaPost ? getQAPostDetailHref(post) : getPostDetailHref(post);

                        return (
                            <Link
                                key={post.id}
                                href={detailHref}
                                className="relative aspect-square bg-muted group overflow-hidden cursor-pointer border border-border sm:rounded-md"
                            >
                                <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                                    <p className="text-[10px] sm:text-xs font-medium text-foreground line-clamp-3">
                                        {post.title}
                                    </p>
                                </div>

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4 fill-white" />
                                        <span>{(post as SelectPostDTO).upvoteCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-4 h-4 fill-white" />
                                        <span>{(post as SelectPostDTO).commentCount || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Sentinel */}
            {!isLoading && !isError && posts && posts.length > 0 && (
                <div ref={sentinelRef} className="h-4" />
            )}

            {/* Spinner */}
            {isFetchingNextPage && (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* End indicator */}
            {!isLoading && !hasNextPage && posts && posts.length > 0 && (
                <p className="py-10 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    You&apos;ve reached the end
                </p>
            )}
        </section>
    );
}

