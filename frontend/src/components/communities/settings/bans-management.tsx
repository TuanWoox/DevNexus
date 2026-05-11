"use client";

import { useGetCommunityBans } from "@/hooks/community-bans-hooks/use-get-community-bans";
import { useUnbanCommunityMember } from "@/hooks/community-bans-hooks/use-unban-community-member";
import { useBanCommunityMember } from "@/hooks/community-bans-hooks/use-ban-community-member";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityBanDTO } from "@/types/community-bans/create-community-ban-dto";
import { MemberSearchModal } from "./member-search-modal";
import Link from "next/link";
import Image from "next/image";

interface BansManagementProps {
    community: SelectCommunityDTO;
}

export function BansManagement({ community }: BansManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Ban modal state
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<{ profileId: string; fullName: string } | null>(null);
    const [banReason, setBanReason] = useState("");

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders: [{ sort: "DateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "datetime" }],
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

    const { data: pagedData, isLoading } = useGetCommunityBans(community.id, pagePayload);
    const { mutate: unbanMember, isPending: isUnbanning } = useUnbanCommunityMember();
    const { mutate: banMember, isPending: isBanning } = useBanCommunityMember();

    const bans = pagedData?.data ?? [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements ?? 0) / pagePayload.size);

    const alreadyBannedProfileIds = bans
        .map(b => b.bannedProfile?.id)
        .filter(Boolean) as string[];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    // Step 1: user selected from modal — show ban reason form
    const handleMemberSelected = (profileId: string, fullName: string) => {
        setSelectedMember({ profileId, fullName });
        setBanReason("");
    };

    // Step 2: confirm ban with reason
    const handleConfirmBan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        const payload: CreateCommunityBanDTO = {
            communityId: community.id,
            bannedProfileId: selectedMember.profileId,
            banReason: banReason.trim(),
        };
        banMember(payload, {
            onSuccess: () => {
                setSelectedMember(null);
                setBanReason("");
            }
        });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Ban User via modal */}
            <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Ban User
                    </h3>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setIsBanModalOpen(true)}
                        disabled={isBanning}
                    >
                        Select Member to Ban
                    </Button>
                </div>

                {/* Step 2: Ban reason form — shown after selecting a member */}
                {selectedMember && (
                    <form onSubmit={handleConfirmBan} className="space-y-3 pt-2 border-t border-red-200/40">
                        <div className="text-sm">
                            Banning: <span className="font-semibold text-foreground">{selectedMember.fullName}</span>
                            <button
                                type="button"
                                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
                                onClick={() => setSelectedMember(null)}
                            >
                                (change)
                            </button>
                        </div>
                        <Textarea
                            placeholder="Ban reason (optional)..."
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            className="bg-background min-h-[60px]"
                        />
                        <Button type="submit" variant="destructive" disabled={isBanning} className="w-full max-w-xs">
                            {isBanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Confirm Ban
                        </Button>
                    </form>
                )}
            </div>

            {/* Search ban list */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search banned users by name..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" variant="secondary">Search</Button>
            </form>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Reason</TableHead>
                            <TableHead className="font-semibold">Date Banned</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    {appliedSearch ? "No bans match your search." : "No banned users."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            bans.map((ban) => (
                                <TableRow key={ban.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <Link
                                            href={`/profile/${ban.bannedProfile?.id ?? ban.id}`}
                                            className="flex items-center gap-3 group w-fit"
                                        >
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                                                {ban.bannedProfile?.avatarUrl ? (
                                                    <Image
                                                        src={ban.bannedProfile.avatarUrl}
                                                        alt={ban.bannedProfile.fullName ?? "User"}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                                                        {(ban.bannedProfile?.fullName ?? "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm group-hover:text-primary transition-colors">
                                                    {ban.bannedProfile?.fullName || "Unknown User"}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">View profile →</span>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                        {ban?.banReason || "No reason provided"}
                                    </TableCell>
                                    <TableCell>
                                        {ban.dateCreated ? new Date(ban.dateCreated).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
                                            onClick={() => unbanMember(ban.id)}
                                            disabled={isUnbanning}
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Unban
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button variant="outline" size="sm" disabled={pageNumber === 0} onClick={() => setPageNumber(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground font-medium">Page {pageNumber + 1} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={pageNumber >= totalPages - 1} onClick={() => setPageNumber(p => p + 1)}>Next</Button>
                </div>
            )}

            {/* Member Search Modal for selecting who to ban */}
            <MemberSearchModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                onSelect={handleMemberSelected}
                communityId={community.id}
                title="Select Member to Ban"
                description="Search community members by name. Only current members can be banned."
                highlightedIds={alreadyBannedProfileIds}
            />
        </div>
    );
}
