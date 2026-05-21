"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, X, Loader2, Send, Users, Check } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useCreateChat } from "@/features/messages/hooks/chats/use-create-chat";
import { useFollowedProfilesSearch } from "@/features/messages/hooks/chats/use-followed-profiles-search";
import { useContactProfilesSearch } from "@/features/messages/hooks/chats/use-contact-profiles-search";
import { ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = 1 | 2;

export function GroupCreationPanel() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<ProfileSummary[]>([]);
    const [groupName, setGroupName] = useState("");
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const createChat = useCreateChat();

    // ── Search hooks ──────────────────────────────────────────────────
    const followSearch = useFollowedProfilesSearch(searchQuery);
    const contactSearch = useContactProfilesSearch(searchQuery);

    const followResults = useMemo(
        () => followSearch.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [],
        [followSearch.data?.pages]
    );

    const contactResults = useMemo(() => {
        const contacts = contactSearch.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [];
        // Deduplicate: remove contacts that already appear in follow results
        const followIds = new Set(followResults.map((p) => p.Id));
        return contacts.filter((p) => !followIds.has(p.Id ?? ""));
    }, [contactSearch.data?.pages, followResults]);

    const selectedIds = new Set(selectedMembers.map((m) => m.Id));

    // ── Handlers ──────────────────────────────────────────────────────
    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            router.push("/messages");
        }
    };

    const toggleMember = (profile: ProfileSummary) => {
        if (selectedIds.has(profile.Id)) {
            setSelectedMembers((prev) => prev.filter((m) => m.Id !== profile.Id));
        } else {
            setSelectedMembers((prev) => [...prev, profile]);
        }
    };

    const removeMember = (profileId: string | undefined) => {
        setSelectedMembers((prev) => prev.filter((m) => m.Id !== profileId));
    };

    const handleSend = async () => {
        const content = message.trim();
        if (!content || createChat.isPending || selectedMembers.length < 2) return;

        createChat.mutate(
            {
                profileIds: selectedMembers.map((m) => m.Id!),
                name: groupName.trim() || undefined,
                message: { Content: content, ChatId: "" },
            },
            {
                onSuccess: (data) => {
                    if (data.result?.Id) {
                        router.replace(`/messages/${data.result.Id}`);
                    } else {
                        toast.error(data.message ?? "Failed to create group");
                    }
                },
                onError: () => {
                    toast.error("Failed to create group. Please try again.");
                },
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    const handleFollowScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (
            followSearch.hasNextPage &&
            !followSearch.isFetchingNextPage &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 60
        ) {
            followSearch.fetchNextPage();
        }
    };

    const handleContactScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (
            contactSearch.hasNextPage &&
            !contactSearch.isFetchingNextPage &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 60
        ) {
            contactSearch.fetchNextPage();
        }
    };

    // ── Profile row renderer ─────────────────────────────────────────
    const renderProfileRow = (profile: ProfileSummary) => {
        const isSelected = selectedIds.has(profile.Id);
        return (
            <button
                key={profile.Id}
                type="button"
                onClick={() => toggleMember(profile)}
                className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-accent/40",
                )}
            >
                <UserAvatar avatarUrl={profile.AvatarUrl} fullName={profile.FullName} className="h-9 w-9 shrink-0 ring-2 ring-border/50" />
                <div className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-foreground">{profile.FullName}</span>
                </div>
                <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                )}>
                    {isSelected && <Check className="h-3 w-3" />}
                </div>
            </button>
        );
    };

    // ══════════════════════════════════════════════════════════════════
    // STEP 1: Member Selection
    // ══════════════════════════════════════════════════════════════════
    if (step === 1) {
        const isSearching = searchQuery.length >= 1;
        const hasFollowResults = followResults.length > 0;
        const hasContactResults = contactResults.length > 0;
        const isLoading = followSearch.isLoading || contactSearch.isLoading;

        return (
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label="Back to messages"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">New Group</p>
                        <p className="text-xs text-muted-foreground">
                            {selectedMembers.length === 0
                                ? "Select at least 2 people"
                                : `${selectedMembers.length} selected`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={selectedMembers.length < 2}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                            selectedMembers.length >= 2
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                : "bg-muted text-muted-foreground/40 cursor-not-allowed",
                        )}
                    >
                        Next
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Selected chips */}
                {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/40">
                        {selectedMembers.map((m) => (
                            <span
                                key={m.Id}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            >
                                <UserAvatar avatarUrl={m.AvatarUrl} fullName={m.FullName} className="h-4 w-4" />
                                {m.FullName.split(" ").slice(-1)[0]}
                                <button
                                    type="button"
                                    onClick={() => removeMember(m.Id)}
                                    className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Search input */}
                <div className="px-4 py-3 border-b border-border/40">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search people..."
                            className={cn(
                                "w-full rounded-lg bg-muted/50 py-2.5 pl-9 pr-8",
                                "text-sm text-foreground placeholder:text-muted-foreground/60",
                                "outline-none ring-0 border-0 transition-all duration-200",
                                "focus:ring-2 focus:ring-primary/20",
                            )}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {/* Not searching — show prompt */}
                    {!isSearching && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-8 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border/50">
                                <Users className="h-7 w-7" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">Add people to your group</p>
                                <p className="text-sm mt-1">Search for people you follow or have chatted with.</p>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isSearching && isLoading && !hasFollowResults && !hasContactResults && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                        </div>
                    )}

                    {/* Empty */}
                    {isSearching && !isLoading && !hasFollowResults && !hasContactResults && (
                        <div className="px-4 py-12 text-center">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No people found</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Try a different search term</p>
                        </div>
                    )}

                    {/* Section: People you follow */}
                    {isSearching && hasFollowResults && (
                        <div>
                            <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                                <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    People you follow
                                </span>
                            </div>
                            <div className="max-h-52 overflow-y-auto overscroll-contain" onScroll={handleFollowScroll}>
                                {followResults.map(renderProfileRow)}
                                {followSearch.isFetchingNextPage && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Section: People you've chatted with */}
                    {isSearching && hasContactResults && (
                        <div className={cn(hasFollowResults && "border-t border-border/40")}>
                            <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                                <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    People you&apos;ve chatted with
                                </span>
                            </div>
                            <div className="max-h-52 overflow-y-auto overscroll-contain" onScroll={handleContactScroll}>
                                {contactResults.map(renderProfileRow)}
                                {contactSearch.isFetchingNextPage && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // STEP 2: Group Details + First Message
    // ══════════════════════════════════════════════════════════════════
    const memberNames = selectedMembers.map((m) => m.FullName.split(" ").slice(-1)[0]).join(", ");

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 shrink-0">
                <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label="Back to member selection"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                {/* Stacked avatars */}
                <div className="flex -space-x-2">
                    {selectedMembers.slice(0, 4).map((m) => (
                        <UserAvatar
                            key={m.Id}
                            avatarUrl={m.AvatarUrl}
                            fullName={m.FullName}
                            className="h-8 w-8 ring-2 ring-card"
                        />
                    ))}
                    {selectedMembers.length > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-card text-[10px] font-bold text-muted-foreground">
                            +{selectedMembers.length - 4}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {groupName.trim() || `Group with ${memberNames}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedMembers.length} members</p>
                </div>
            </div>

            {/* Body — group name + empty state */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                {/* Group name input */}
                <div className="w-full max-w-xs">
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name (optional)"
                        className={cn(
                            "w-full rounded-lg bg-muted/50 px-4 py-2.5 text-center",
                            "text-sm font-medium text-foreground placeholder:text-muted-foreground/60",
                            "outline-none ring-0 border-0 transition-all duration-200",
                            "focus:ring-2 focus:ring-primary/20",
                        )}
                        maxLength={100}
                    />
                </div>

                {/* Member avatars */}
                <div className="flex -space-x-3 justify-center">
                    {selectedMembers.slice(0, 6).map((m) => (
                        <UserAvatar
                            key={m.Id}
                            avatarUrl={m.AvatarUrl}
                            fullName={m.FullName}
                            className="h-14 w-14 ring-4 ring-card shadow-sm"
                        />
                    ))}
                    {selectedMembers.length > 6 && (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-4 ring-card text-sm font-bold text-muted-foreground">
                            +{selectedMembers.length - 6}
                        </div>
                    )}
                </div>

                <div className="text-muted-foreground">
                    <p className="text-base font-semibold text-foreground">
                        {groupName.trim() || `Group with ${memberNames}`}
                    </p>
                    <p className="text-sm mt-1">
                        Send a message to create this group chat.
                    </p>
                </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border/60 bg-card px-4 py-3 shrink-0">
                <div className={cn(
                    "flex items-end gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2",
                    "focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200",
                )}>
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type the first message..."
                        rows={1}
                        disabled={createChat.isPending}
                        className={cn(
                            "flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
                            "outline-none border-0 ring-0 py-1 max-h-[120px] overflow-y-auto",
                            "disabled:opacity-50",
                        )}
                        style={{ height: "36px" }}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!message.trim() || createChat.isPending}
                        className={cn(
                            "shrink-0 rounded-lg p-2 transition-all duration-200",
                            message.trim() && !createChat.isPending
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                : "text-muted-foreground/40 cursor-not-allowed",
                        )}
                        aria-label="Send message and create group"
                    >
                        {createChat.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />
                        }
                    </button>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">
                    Press Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
