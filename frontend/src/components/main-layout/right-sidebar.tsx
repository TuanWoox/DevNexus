"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Loader2, MessageSquare, TrendingUp, Users, Globe, Sparkles, ChevronRight } from "lucide-react";
import { useGetTrendingPosts } from "@/hooks/recommendation-hooks/use-get-trending-posts";
import { useGetTrendingCommunities } from "@/hooks/recommendation-hooks/use-get-trending-communities";
import { getPostDetailHref } from "@/utils/content-routes";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { formatDistanceToNow } from "date-fns";

export function RightSidebar() {
    const pathname = usePathname();
    const mounted = useHasMounted();
    const [activeTab, setActiveTab] = useState<"posts" | "communities">("posts");

    const { data: trendingPosts, isLoading: isLoadingPosts } = useGetTrendingPosts("7d", 5);
    const { data: trendingCommunities, isLoading: isLoadingCommunities } = useGetTrendingCommunities("7d", 5);

    if (pathname?.startsWith("/messages")) return null;

    return (
        <aside className="hidden xl:block w-80 sticky top-0 h-screen py-6 px-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="card p-5 border border-border/70 bg-card/95 shadow-card backdrop-blur-sm transition-all duration-300 hover:shadow-elevated rounded-2xl flex flex-col gap-4">
                
                {/* Clean Tab Header */}
                <div className="flex items-center gap-4 border-b border-border/40 pb-2.5 px-1">
                    <button 
                        onClick={() => setActiveTab("posts")}
                        className={`relative pb-2 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none ${
                            activeTab === "posts" ? "text-heading" : "text-muted-foreground hover:text-heading"
                        }`}
                    >
                        <Flame className={`h-4 w-4 transition-transform duration-300 ${activeTab === "posts" ? "text-rose-500 scale-110" : "text-muted-foreground"}`} />
                        Trending
                        {activeTab === "posts" && (
                            <span className="absolute bottom-[-11px] left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in duration-200" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab("communities")}
                        className={`relative pb-2 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none ${
                            activeTab === "communities" ? "text-heading" : "text-muted-foreground hover:text-heading"
                        }`}
                    >
                        <Users className={`h-4 w-4 transition-transform duration-300 ${activeTab === "communities" ? "text-primary scale-110" : "text-muted-foreground"}`} />
                        Communities
                        {activeTab === "communities" && (
                            <span className="absolute bottom-[-11px] left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in duration-200" />
                        )}
                    </button>
                </div>

                {/* Trending Posts Tab */}
                {activeTab === "posts" && (
                    <div className="flex flex-col gap-1">
                        {isLoadingPosts && (
                            <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Loading trending posts...</span>
                            </div>
                        )}

                        {!isLoadingPosts && trendingPosts?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Sparkles className="h-6 w-6 text-muted/40 mb-2" />
                                <p className="text-xs text-muted-foreground font-medium">
                                    No trending posts available.
                                </p>
                            </div>
                        )}

                        {!isLoadingPosts && trendingPosts?.map((post, index) => {
                            const firstTag = post.tagNames && post.tagNames[0];
                            const relativeTime = mounted 
                                ? formatDistanceToNow(new Date(post.dateCreated), { addSuffix: true }) 
                                : "";

                            return (
                                <Link
                                    key={post.id}
                                    href={getPostDetailHref(post)}
                                    className="group flex gap-3 items-start rounded-xl p-2 border border-transparent transition-all duration-200 hover:bg-muted/40 hover:border-border/40"
                                >
                                    {/* Rank Number */}
                                    <span className="font-mono text-sm font-extrabold text-muted-foreground/30 w-4 text-center shrink-0 pt-0.5 select-none group-hover:text-primary/50 transition-colors">
                                        {index + 1}
                                    </span>

                                    {/* Content Block */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                            {post.community ? (
                                                <span className="font-bold text-primary truncate max-w-[120px]">
                                                    c/{post.community.name}
                                                </span>
                                            ) : (
                                                <span className="truncate max-w-[120px]">
                                                    u/{post.author?.fullName || 'anonymous'}
                                                </span>
                                            )}
                                            {mounted && relativeTime && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-[9px] truncate shrink-0">
                                                        {relativeTime}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <span className="text-xs font-bold text-heading leading-snug tracking-tight transition-colors group-hover:text-primary line-clamp-2">
                                            {post.title}
                                        </span>

                                        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-0.5 hover:text-emerald-500 transition-colors">
                                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                    {post.upvoteCount ?? 0}
                                                </span>
                                                <span className="inline-flex items-center gap-0.5 hover:text-primary transition-colors">
                                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                                    {post.commentCount ?? 0}
                                                </span>
                                            </div>

                                            {firstTag && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-muted/40 text-muted-foreground rounded-md border border-border/50">
                                                    #{firstTag}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Communities Tab */}
                {activeTab === "communities" && (
                    <div className="flex flex-col gap-1">
                        {isLoadingCommunities && (
                            <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Loading communities...</span>
                            </div>
                        )}

                        {!isLoadingCommunities && trendingCommunities?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Globe className="h-6 w-6 text-muted/40 mb-2" />
                                <p className="text-xs text-muted-foreground font-medium">
                                    No communities available.
                                </p>
                            </div>
                        )}

                        {!isLoadingCommunities && trendingCommunities?.map((community, index) => (
                            <Link
                                key={community.id}
                                href={`/communities/${community.id}`}
                                className="group flex items-center gap-3 rounded-xl p-2 border border-transparent transition-all duration-200 hover:bg-muted/40 hover:border-border/40"
                            >
                                {/* Rank Number */}
                                <span className="font-mono text-sm font-extrabold text-muted-foreground/30 w-4 text-center shrink-0 select-none group-hover:text-primary/50 transition-colors">
                                    {index + 1}
                                </span>

                                {/* Community Cover Avatar */}
                                <div className="relative isolate block size-8 shrink-0 overflow-hidden rounded-lg border border-default bg-primary/5">
                                    {community.communityCoverPhotoUrl ? (
                                        <img 
                                            src={community.communityCoverPhotoUrl} 
                                            alt={community.name} 
                                            className="size-full object-cover" 
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center">
                                            <Globe className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="text-xs font-bold text-heading truncate group-hover:text-primary transition-colors">
                                        {community.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {community.memberCount?.toLocaleString() ?? 0} members
                                    </span>
                                </div>

                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Clean Footer Links */}
            <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1.5 px-3 text-xs text-dimmed">
                <Link href="/about" className="hover:text-primary hover:underline transition-all">About</Link>
                <Link href="/faq" className="hover:text-primary hover:underline transition-all">Help</Link>
                <Link href="/privacy" className="hover:text-primary hover:underline transition-all">Privacy</Link>
                <Link href="/terms" className="hover:text-primary hover:underline transition-all">Terms</Link>
                <span className="w-full mt-2 block border-t border-border/30 pt-2 text-[10px]">© 2026 DevNexus. All rights reserved.</span>
            </div>
        </aside>
    );
}

