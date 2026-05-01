"use client";

import { useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chat } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle, getInitials, getProfileId } from "@/features/messages/utils/message-service.helper";

interface MessageSearchProps {
    value: string;
    onChange: (value: string) => void;
    results: Chat[];
    isLoading: boolean;
    isFetchingMore: boolean;
    hasMore: boolean;
    onSelectResult: (chat: Chat) => void;
    onLoadMore: () => void;
}

export function MessageSearch({
    value,
    onChange,
    results,
    isLoading,
    isFetchingMore,
    hasMore,
    onSelectResult,
    onLoadMore,
}: MessageSearchProps) {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isOpen = value.length >= 1;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onChange("");
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onChange]);

    return (
        <div className="relative" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search conversations..."
                className={cn(
                    "w-full rounded-xl bg-muted/60 py-2 pl-9 pr-8",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "outline-none ring-0 border-0",
                    "focus:bg-muted focus:ring-1 focus:ring-primary/20",
                    "transition-colors",
                )}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        if (
                            hasMore &&
                            !isFetchingMore &&
                            el.scrollHeight - el.scrollTop - el.clientHeight < 60
                        ) {
                            onLoadMore();
                        }
                    }}
                >
                    {isLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!isLoading && results.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No results found
                        </div>
                    )}

                    {results.map((chat) => {
                        const title = getTitle(chat, currentProfileId);
                        const avatarUrl = getAvatarUrl(chat, currentProfileId);
                        const isGroup = chat.IsGroup;

                        return (
                            <button
                                key={chat.Id}
                                type="button"
                                onClick={() => onSelectResult(chat)}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/60 transition-colors"
                            >
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={avatarUrl} alt={title} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                        {getInitials(title)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {title}
                                        </span>
                                        {isGroup && (
                                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                Group
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {isFetchingMore && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
