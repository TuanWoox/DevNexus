"use client";

import { useRef, useEffect, useMemo } from "react";
import { Search, X, Loader2, CornerDownLeft, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Chat, ProfileSummary } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getAvatarUrl, getTitle } from "@/features/messages/utils/message-service.helper";
import { useChatSearch } from "@/features/messages/hooks/chats/use-chat-search";
import { useFollowedProfilesSearch } from "@/features/messages/hooks/chats/use-followed-profiles-search";

interface MessageSearchProps {
    value: string;
    onChange: (value: string) => void;
    onSelectChat: (chat: Chat) => void;
    onSelectPerson: (profile: ProfileSummary) => void;
}

export function MessageSearch({
    value,
    onChange,
    onSelectChat,
    onSelectPerson,
}: MessageSearchProps) {
    const currentProfileId = useSelector((state: RootState) => state.auth.user?.profileId ?? "");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isOpen = value.length >= 1;

    // ── Both search hooks live here now ──────────────────────────────────
    const chatSearch = useChatSearch(value);
    const followSearch = useFollowedProfilesSearch(value);

    const chatResults = useMemo(
        () => chatSearch.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [],
        [chatSearch.data?.pages]
    );

    const peopleResults = useMemo<ProfileSummary[]>(() => {
        const followed = followSearch.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [];
        // Deduplicate: hide people who already appear in a personal chat result
        const existingMemberIds = new Set(
            chatResults
                .filter((c) => !c.IsGroup)
                .flatMap((c) => c.Members.map((m) => m.MemberId))
        );
        return followed.filter((p) => !existingMemberIds.has(p.Id ?? ""));
    }, [followSearch.data?.pages, chatResults]);

    const hasChats = chatResults.length > 0;
    const hasPeople = peopleResults.length > 0;
    const hasResults = hasChats || hasPeople;
    const isLoading = chatSearch.isLoading || followSearch.isLoading;

    // ── Close on click outside ───────────────────────────────────────────
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onChange("");
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onChange]);

    // ── Ctrl+K / Cmd+K to focus ──────────────────────────────────────────
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

    const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (
            chatSearch.hasNextPage &&
            !chatSearch.isFetchingNextPage &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 60
        ) {
            chatSearch.fetchNextPage();
        }
    };

    const handlePeopleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (
            followSearch.hasNextPage &&
            !followSearch.isFetchingNextPage &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 60
        ) {
            followSearch.fetchNextPage();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ── Input ── */}
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
                    placeholder="Search conversations & people..."
                    className={cn(
                        "w-full rounded-lg bg-muted/50 py-2.5 pl-9 pr-20",
                        "text-sm text-foreground placeholder:text-muted-foreground/60",
                        "outline-none ring-0 border-0 transition-all duration-200",
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

            {/* ── Dropdown ── */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-border/80 bg-card shadow-xl overflow-hidden">

                    {/* Global loading (first load, nothing yet) */}
                    {isLoading && !hasResults && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !hasResults && (
                        <div className="px-4 py-8 text-center">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No results found</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Try a different search term</p>
                        </div>
                    )}

                    {/* ── Section: Conversations (own scroll area) ── */}
                    {hasChats && (
                        <div>
                            <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Conversations
                                </span>
                            </div>
                            <div
                                className="max-h-48 overflow-y-auto overscroll-contain"
                                onScroll={handleChatScroll}
                            >
                                {chatResults.map((chat) => {
                                    const title = getTitle(chat, currentProfileId);
                                    const avatarUrl = getAvatarUrl(chat, currentProfileId);
                                    return (
                                        <button
                                            key={chat.Id}
                                            type="button"
                                            onClick={() => { onSelectChat(chat); onChange(""); }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40 transition-colors"
                                        >
                                            <UserAvatar
                                                avatarUrl={avatarUrl}
                                                fullName={title}
                                                className="h-9 w-9 shrink-0 ring-2 ring-border/50"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-semibold text-foreground">{title}</span>
                                                    {chat.IsGroup && (
                                                        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Group</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                                {chatSearch.isFetchingNextPage && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Section: People you follow (own scroll area) ── */}
                    {(hasPeople || followSearch.isLoading) && (
                        <div className={cn(hasChats && "border-t border-border/40")}>
                            <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                                <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    People you follow
                                </span>
                            </div>
                            <div
                                className="max-h-48 overflow-y-auto overscroll-contain"
                                onScroll={handlePeopleScroll}
                            >
                                {followSearch.isLoading && !hasPeople ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    peopleResults.map((profile) => (
                                        <button
                                            key={profile.Id}
                                            type="button"
                                            onClick={() => { onSelectPerson(profile); onChange(""); }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40 transition-colors"
                                        >
                                            <UserAvatar
                                                avatarUrl={profile.AvatarUrl}
                                                fullName={profile.FullName}
                                                className="h-9 w-9 shrink-0 ring-2 ring-border/50"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <span className="truncate text-sm font-semibold text-foreground">{profile.FullName}</span>
                                                <p className="text-xs text-muted-foreground mt-0.5">Start a new conversation</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                                {followSearch.isFetchingNextPage && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {hasResults && <div className="pb-1" />}
                </div>
            )}
        </div>
    );
}
