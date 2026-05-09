"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, Check, Loader2 } from "lucide-react";
import { CommunityFetchMode } from "@/constants/communityFetchMode";
import { useGetCommunitiesByModeInfinite } from "@/hooks/community-hooks/use-get-communities-by-mode-infinite";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import Image from "next/image";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface CommunitySelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string, name: string, iconUrl?: string) => void;
    selectedId?: string;
}

export function CommunitySelectModal({
    isOpen,
    onClose,
    onSelect,
    selectedId,
}: CommunitySelectModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    useEffect(() => {
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSearchQuery("");
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDebouncedSearchQuery("");
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const basePayload = useMemo(() => ({
        totalElements: 0,
        fetchMode: CommunityFetchMode.YOURS,
        orders: [],
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
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetCommunitiesByModeInfinite(basePayload, isOpen);

    const communities = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    const handleIntersect = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const sentinelRef = useIntersectionObserver(handleIntersect);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-xl font-bold">Select a Community</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Choose where you want to share your post.
                    </p>
                </DialogHeader>

                <div className="pb-4 px-4 border-b bg-subtle/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search your communities..."
                            className="pl-10 h-11 bg-background border-default"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-2 px-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading your communities...</p>
                        </div>
                    ) : communities?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-heading">No communities found</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                    ? "Try a different search term."
                                    : "You haven't joined any communities yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {communities?.map((community) => (
                                <button
                                    key={community.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(community.id, community.name, community.communityCoverPhotoUrl);
                                        onClose();
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-primary/5 group ${selectedId === community.id
                                        ? "bg-primary/10 border-primary/20"
                                        : "border-transparent"
                                        }`}
                                >
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-primary/10 shrink-0 border border-default group-hover:border-primary/30">
                                        {community.communityCoverPhotoUrl ? (
                                            <Image
                                                src={community.communityCoverPhotoUrl}
                                                alt={community.name}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Users className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <h4 className="font-bold text-heading break-words group-hover:text-primary transition-colors leading-tight mb-1">
                                            {community.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground break-words line-clamp-2">
                                            {community.description || "Community"}
                                        </p>
                                    </div>
                                    {selectedId === community.id && (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}

                            {/* Sentinel for infinite scroll */}
                            <div ref={sentinelRef} className="h-4" />

                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
