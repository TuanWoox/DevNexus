"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Check, Loader2, Plus, X } from "lucide-react";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { useGetMyBookmarksInfinite } from "@/hooks/bookmark-hooks/use-get-my-bookmarks-infinite";
import { useCreateBookmark } from "@/hooks/bookmark-hooks/use-create-bookmark";
import { useCreateBookmarkedItem } from "@/hooks/bookmarked-item-hooks/use-create-bookmarked-item";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { SortOrderType } from "@/constants/sortOrderType";

interface SaveBookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    isQAPost: boolean;
}

export function SaveBookmarkModal({
    isOpen,
    onClose,
    postId,
    isQAPost,
}: SaveBookmarkModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
    const [newCollectionName, setNewCollectionName] = useState("");

    const { mutate: createBookmark, isPending: isCreatingBookmark } = useCreateBookmark();
    const { mutate: createBookmarkedItem, isPending: isSavingItem } = useCreateBookmarkedItem();

    const handleClose = () => {
        setSearchQuery("");
        setDebouncedSearchQuery("");
        setSelectedBookmarkId(null);
        setNewCollectionName("");
        onClose();
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const infinitePayload = useMemo(() => ({
        totalElements: 0,
        orders: [
            { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
        ],
        filter: debouncedSearchQuery ? [
            {
                prop: "Name",
                value: debouncedSearchQuery,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: "",
            }
        ] : [],
        selected: [],
    }), [debouncedSearchQuery]);

    const {
        data: bookmarkData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useGetMyBookmarksInfinite(infinitePayload, isOpen);

    const bookmarks = useMemo(
        () => bookmarkData?.pages.flatMap((page) => page?.data ?? []) ?? [],
        [bookmarkData]
    );

    const handleIntersect = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };
    const sentinelRef = useIntersectionObserver(handleIntersect);

    const handleCreateCollection = () => {
        if (!newCollectionName.trim()) return;
        createBookmark({ name: newCollectionName.trim() }, {
            onSuccess: () => {
                setNewCollectionName("");
                // We won't automatically select the newly created one because the ID isn't returned directly in the DTO unless we refetch.
                // Actually, the hook invalidates the query, so it will show up in the list.
            }
        });
    };

    const handleConfirm = () => {
        if (!selectedBookmarkId) return;

        createBookmarkedItem({
            bookmarkId: selectedBookmarkId,
            postId: isQAPost ? undefined : postId,
            qaPostId: isQAPost ? postId : undefined,
        }, {
            onSuccess: () => {
                handleClose();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px] p-4 overflow-hidden flex flex-col h-[80vh]" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold">Save to Bookmark</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Select a collection or create a new one to save this post.
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full cursor-pointer"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="pb-4 border-b bg-subtle/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search collections..."
                            className="pl-10 h-11 bg-background border-default"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading collections...</p>
                        </div>
                    ) : bookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Bookmark className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-heading">No collections found</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                    ? "Try a different search term."
                                    : "You haven't created any bookmark collections yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-1 mt-2">
                            {bookmarks.map((bookmark) => (
                                <button
                                    key={bookmark.id}
                                    type="button"
                                    onClick={() => setSelectedBookmarkId(bookmark.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-primary/5 group ${selectedBookmarkId === bookmark.id
                                        ? "bg-primary/10 border-primary/20"
                                        : "border-transparent"
                                        }`}
                                >
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-primary/10 shrink-0 border border-default group-hover:border-primary/30 flex items-center justify-center">
                                        <Bookmark className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <h4 className="font-bold text-heading break-words group-hover:text-primary transition-colors leading-tight mb-1">
                                            {bookmark.name}
                                        </h4>
                                    </div>
                                    {selectedBookmarkId === bookmark.id && (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            <div ref={sentinelRef} className="h-2" />
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t bg-subtle/30">
                    <h4 className="text-sm font-semibold mb-2">Create New Collection</h4>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Collection name..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateCollection();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            onClick={handleCreateCollection}
                            disabled={!newCollectionName.trim() || isCreatingBookmark}
                            className="btn-ai text-white"
                        >
                            {isCreatingBookmark ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Create
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                    <Button variant="outline" type="button" className="cursor-pointer" onClick={handleClose} disabled={isSavingItem}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedBookmarkId || isSavingItem}
                        variant="custom"
                        className="btn-primary text-white"
                    >
                        {isSavingItem ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
