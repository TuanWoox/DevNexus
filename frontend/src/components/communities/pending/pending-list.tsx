"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PendingListItem } from "./pending-list-item";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { cn } from "@/lib/utils";

export type PendingWorkspaceItem = SelectPostDTO & {
    isQuestion?: boolean;
};

interface PendingListProps {
    items: PendingWorkspaceItem[];
    activeId: string | null;
    onSelect: (item: PendingWorkspaceItem) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterTab: "all" | "posts" | "questions";
    onFilterTabChange: (tab: "all" | "posts" | "questions") => void;
    totalPostsCount: number;
    totalQuestionsCount: number;
}

export function PendingList({
    items,
    activeId,
    onSelect,
    searchQuery,
    onSearchChange,
    filterTab,
    onFilterTabChange,
    totalPostsCount,
    totalQuestionsCount
}: PendingListProps) {
    return (
        <div className="flex flex-col h-full bg-card">
            {/* 1. Sidebar Header and Search Box */}
            <div className="p-4 space-y-3 border-b border-border/40 bg-card shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search pending posts..."
                        className="pl-9 h-9 text-xs rounded-lg border-border/60 bg-muted/20 focus-visible:ring-primary/20"
                    />
                </div>

                {/* 2. Mini Tab filters */}
                <div className="flex p-0.5 rounded-lg bg-muted/40 border border-border/20 text-xs">
                    <button
                        onClick={() => onFilterTabChange("all")}
                        className={cn(
                            "flex-1 py-1 text-center font-medium rounded-md transition-all select-none",
                            filterTab === "all"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({totalPostsCount + totalQuestionsCount})
                    </button>
                    <button
                        onClick={() => onFilterTabChange("posts")}
                        className={cn(
                            "flex-1 py-1 text-center font-medium rounded-md transition-all select-none",
                            filterTab === "posts"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Posts ({totalPostsCount})
                    </button>
                    <button
                        onClick={() => onFilterTabChange("questions")}
                        className={cn(
                            "flex-1 py-1 text-center font-medium rounded-md transition-all select-none",
                            filterTab === "questions"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Q&A ({totalQuestionsCount})
                    </button>
                </div>
            </div>

            {/* 3. Scrollable List Panel */}
            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/20">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <p className="text-xs text-muted-foreground font-medium">No matching items found</p>
                    </div>
                ) : (
                    items.map((item) => {
                        return (
                            <PendingListItem
                                key={item.id}
                                item={item}
                                isActive={item.id === activeId}
                                onClick={() => onSelect(item)}
                                isQuestion={item.isQuestion}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
