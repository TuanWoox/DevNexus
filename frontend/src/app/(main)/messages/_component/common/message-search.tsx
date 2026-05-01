"use client";

import { useRef, useEffect } from "react";
import { Search, X, Loader2, CornerDownLeft } from "lucide-react";
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
    const inputRef = useRef<HTMLInputElement>(null);
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

    // Ctrl+K / Cmd+K to focus search
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className={cn(
                "relative rounded-lg transition-all duration-200",
                isOpen && "ring-2 ring-primary/20 shadow-[0_0_12px_rgba(99,102,241,0.06)]",
            )}>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search conversations..."
                    className={cn(
                        "w-full rounded-lg bg-muted/50 py-2.5 pl-9 pr-20",
                        "text-sm text-foreground placeholder:text-muted-foreground/60",
                        "outline-none ring-0 border-0",
                        "transition-all duration-200",
                    )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {value ? (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground pointer-events-none select-none">
                            <CornerDownLeft className="h-2.5 w-2.5" />K
                        </kbd>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-80 overflow-y-auto rounded-lg border border-border/80 bg-card shadow-xl"
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
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                        </div>
                    )}

                    {!isLoading && results.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No conversations found</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Try a different search term</p>
                        </div>
                    )}

                    {results.map((chat, idx) => {
                        const title = getTitle(chat, currentProfileId);
                        const avatarUrl = getAvatarUrl(chat, currentProfileId);
                        const isGroup = chat.IsGroup;

                        return (
                            <button
                                key={chat.Id}
                                type="button"
                                onClick={() => onSelectResult(chat)}
                                className={cn(
                                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors",
                                    idx === 0 && "pt-4",
                                )}
                            >
                                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border/50">
                                    <AvatarImage src={avatarUrl} alt={title} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {getInitials(title)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-foreground">
                                            {title}
                                        </span>
                                        {isGroup && (
                                            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                                Group
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {isFetchingMore && (
                        <div className="flex justify-center py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
