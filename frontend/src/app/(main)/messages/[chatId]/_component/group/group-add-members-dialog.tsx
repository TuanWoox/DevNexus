"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Loader2, X, Check } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { profileService } from "@/features/messages/services/profile-service";
import { useAddMembers } from "@/features/messages/hooks/groups/use-add-members";
import { useGroupMembers } from "@/features/messages/hooks/groups/use-group-members";
import { cn } from "@/lib/utils";
import type { ProfileSummary } from "@/features/messages/types/contracts";

interface GroupAddMembersDialogProps {
    open: boolean;
    onClose: () => void;
    chatId: string;
}

export function GroupAddMembersDialog({ open, onClose, chatId }: GroupAddMembersDialogProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ProfileSummary[]>([]);
    const [selected, setSelected] = useState<ProfileSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { data: existingMembers } = useGroupMembers(chatId);
    const addMembers = useAddMembers(chatId);

    // Stable ref so searchProfiles doesn't recreate on every render
    const existingIds = useMemo(
        () => existingMembers?.map((m) => m.ProfileId) ?? [],
        [existingMembers]
    );
    const existingIdsRef = useRef(existingIds);
    existingIdsRef.current = existingIds;

    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    const searchProfiles = useCallback(async (q: string) => {
        if (q.trim().length < 1) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await profileService.searchProfiles(q, existingIdsRef.current);
            if (res.result) {
                setResults(res.result.filter((p) => !selectedRef.current.find((s) => s.Id === p.Id)));
            }
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []); // stable — reads latest values via refs

    useEffect(() => {
        const timer = setTimeout(() => {
            searchProfiles(query);
        }, 400);
        return () => clearTimeout(timer);
    }, [query, searchProfiles]);

    const toggleSelect = (profile: ProfileSummary) => {
        setSelected((prev) =>
            prev.find((p) => p.Id === profile.Id)
                ? prev.filter((p) => p.Id !== profile.Id)
                : [...prev, profile]
        );
    };

    const handleAdd = () => {
        if (selected.length === 0) return;
        addMembers.mutate(
            { profileIds: selected.map((s) => s.Id!).filter(Boolean) },
            {
                onSuccess: (data) => {
                    if (!data.message) {
                        setSelected([]);
                        setQuery("");
                        onClose();
                    }
                },
            }
        );
    };

    const handleClose = () => {
        setSelected([]);
        setQuery("");
        setResults([]);
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
            <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b border-border/60 shrink-0">
                    <SheetTitle className="text-sm font-semibold">Add Members</SheetTitle>
                </SheetHeader>

                {/* Search */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name..."
                            className="pl-9 pr-4"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Selected chips */}
                {selected.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                        {selected.map((p) => (
                            <span
                                key={p.Id}
                                className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 text-brand-600 text-xs font-medium px-2.5 py-1"
                            >
                                {p.FullName}
                                <button
                                    type="button"
                                    onClick={() => toggleSelect(p)}
                                    className="ml-0.5 rounded-full hover:bg-brand-500/20 p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {isSearching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="flex flex-col">
                            {results.map((profile) => {
                                const isSelected = !!selected.find((s) => s.Id === profile.Id);
                                return (
                                    <button
                                        key={profile.Id}
                                        type="button"
                                        onClick={() => toggleSelect(profile)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left",
                                            isSelected && "bg-brand-500/5",
                                        )}
                                    >
                                        <UserAvatar
                                            avatarUrl={profile.AvatarUrl}
                                            fullName={profile.FullName}
                                            className="h-9 w-9 shrink-0"
                                        />
                                        <span className="flex-1 text-sm font-medium text-foreground">
                                            {profile.FullName}
                                        </span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-brand-500 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : query.trim().length > 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No profiles found
                        </p>
                    ) : null}
                </div>

                {/* Footer */}
                {selected.length > 0 && (
                    <div className="px-4 py-3 border-t border-border/60 shrink-0">
                        <Button
                            onClick={handleAdd}
                            disabled={addMembers.isPending}
                            className="w-full"
                            size="sm"
                        >
                            {addMembers.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Add {selected.length} member{selected.length > 1 ? "s" : ""}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
