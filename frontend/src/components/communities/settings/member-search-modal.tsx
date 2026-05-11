"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, Check } from "lucide-react";
import { useGetCommunityMembers } from "@/hooks/community-members-hooks/use-get-community-members";
import { SortOrderType } from "@/constants/sortOrderType";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SelectCommunityMemberDTO } from "@/types/community-member/select-community-member-dto";
import Image from "next/image";
import Link from "next/link";

interface MemberSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (profileId: string, fullName: string) => void;
    communityId: string;
    title: string;
    description?: string;
    /** profileIds already promoted/banned — highlighted to warn operator */
    highlightedIds?: string[];
}

export function MemberSearchModal({
    isOpen,
    onClose,
    onSelect,
    communityId,
    title,
    description,
    highlightedIds = [],
}: MemberSearchModalProps) {
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const payload = {
        size: 20,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: "dateCreated", sortDir: SortOrderType.ASC, dynamicProperty: "", delimiter: "", dataType: "" }],
        filter: appliedSearch ? [
            {
                prop: "Profile.FullName",
                value: appliedSearch,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: "",
            }
        ] : [],
        selected: [],
    };

    const { data: pagedData, isLoading } = useGetCommunityMembers(communityId, payload);
    const members: SelectCommunityMemberDTO[] = pagedData?.data ?? [];

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchInput.trim());
        setSelectedId(null);
    }, [searchInput]);

    const handleConfirm = () => {
        if (!selectedId) return;
        const member = members.find(m => m.profileId === selectedId);
        onSelect(selectedId, member?.profile?.fullName ?? "Unknown");
        handleClose();
    };

    const handleClose = () => {
        setSearchInput("");
        setAppliedSearch("");
        setSelectedId(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </DialogHeader>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Search by full name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="sm">Search</Button>
                </form>

                {/* Results list */}
                <div className="mt-2 border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {appliedSearch ? `No members found matching "${appliedSearch}"` : "Search for a member by name"}
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {members.map((member) => {
                                const isSelected = selectedId === member.profileId;
                                const isAlreadyManaged = highlightedIds.includes(member.profileId);

                                return (
                                    <li
                                        key={member.id}
                                        onClick={() => setSelectedId(member.profileId)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                                            ${isSelected ? "bg-primary/10" : "hover:bg-muted/40"}
                                        `}
                                    >
                                        {/* Avatar */}
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                                            {member.profile?.avatarUrl ? (
                                                <Image
                                                    src={member.profile.avatarUrl}
                                                    alt={member.profile.fullName ?? "Member"}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name + owner badge */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium truncate">
                                                    {member.profile?.fullName ?? "Unknown"}
                                                </span>
                                                {member.isOwner && (
                                                    <span className="text-xs text-yellow-600 font-medium shrink-0">Owner</span>
                                                )}
                                                {isAlreadyManaged && (
                                                    <span className="text-xs text-primary font-medium shrink-0">Already added</span>
                                                )}
                                            </div>
                                            <Link
                                                href={`/profile/${member.profileId}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                View profile →
                                            </Link>
                                        </div>

                                        {/* Selected check */}
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-primary shrink-0" />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedId}
                        variant="custom"
                        className="btn-primary text-white"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
