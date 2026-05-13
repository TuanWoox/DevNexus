"use client";

import { Ref } from 'react';
import { Loader2, Bookmark, MoreHorizontal, Pen, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCard } from '@/components/post/post-card';
import { UnavailablePostCard } from '@/components/post/unavailable-post-card';
import { cn } from '@/lib/utils';
import { SelectBookmarkDTO } from '@/types/bookmark/select-bookmark-dto';

interface CollectionItemsFeedProps {
    selectedCollection: SelectBookmarkDTO | undefined;
    items: any[];
    isLoading: boolean;
    isFetchingNext: boolean;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    sentinelRef: Ref<HTMLDivElement>;
    collectionsCount: number;
}

export const CollectionItemsFeed = ({
    selectedCollection,
    items,
    isLoading,
    isFetchingNext,
    onBack,
    onEdit,
    onDelete,
    sentinelRef,
    collectionsCount
}: CollectionItemsFeedProps) => {
    const isSelected = !!selectedCollection;

    if (!isLoading && collectionsCount === 0) {
        return (
            <main className={cn(
                "flex flex-col items-center justify-center flex-1 text-center p-8",
                isSelected ? "flex" : "hidden lg:flex"
            )}>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <Bookmark className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">No Saved Collections</h2>
                <p className="text-muted-foreground max-w-sm">
                    You currently don't have a bookmark collection. Click the plus icon to create your first one!
                </p>
            </main>
        );
    }

    return (
        <main className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto relative",
            isSelected ? "flex" : "hidden lg:flex"
        )}>
            {isSelected ? (
                <>
                    {/* Top Header */}
                    <header className="flex flex-row justify-between items-center px-4 md:px-6 py-4 border-b border-border shrink-0 bg-card">
                        {/* Left side */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden rounded-full h-9 w-9"
                                onClick={onBack}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md">
                                {selectedCollection.name}
                            </h1>
                        </div>

                        {/* Right side */}
                        <div className="flex flex-row items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-9 h-9 rounded-full flex shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" aria-label="More Actions">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border">
                                    <DropdownMenuItem
                                        onClick={onEdit}
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Pen className="w-4 h-4" />
                                        Rename Collection
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Collection
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Content Feed (Card List) */}
                    <div className="flex flex-col gap-4 p-6 mx-auto w-full max-w-5xl">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold mb-2">No items in this collection</h3>
                                <p className="text-muted-foreground">Articles you save to this collection will appear here.</p>
                            </div>
                        ) : (
                            <>
                                {items.map((item) => {
                                    const actualPost = item.post || item.qaPost;
                                    if (!actualPost) return (
                                        <UnavailablePostCard key={item.id} bookmarkedItemId={item.id} />
                                    );
                                    return (
                                        <div key={item.id} className="relative">
                                            <PostCard post={actualPost} />
                                        </div>
                                    );
                                })}
                                <div ref={sentinelRef} className="h-4" />
                                {isFetchingNext && (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
                    <h2 className="text-xl font-bold mb-2">Select a Collection</h2>
                    <p className="text-muted-foreground">Select a collection from the sidebar to view your saved items.</p>
                </div>
            )}
        </main>
    );
};
