"use client";

import { useGetCommunityBans } from "@/hooks/community-bans-hooks/use-get-community-bans";
import { useUnbanCommunityMember } from "@/hooks/community-bans-hooks/use-unban-community-member";
import { useBanCommunityMember } from "@/hooks/community-bans-hooks/use-ban-community-member";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Search, ShieldAlert, ShieldCheck, Calendar } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityBanDTO } from "@/types/community-bans/create-community-ban-dto";
import { MemberSearchModal } from "./member-search-modal";
import { ManagementProfileCell } from "./management-profile-cell";
import { useDebounce } from "@/hooks/use-debounce";

interface BansManagementProps {
    community: SelectCommunityDTO;
}

export function BansManagement({ community }: BansManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery.trim(), 400);

    // Ban modal state
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<{ profileId: string; fullName: string } | null>(null);
    const [banReason, setBanReason] = useState("");

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders: [{ sort: "DateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "datetime" }],
        filter: debouncedSearch ? [
            {
                prop: "BannedProfile.FullName",
                value: debouncedSearch,
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
        .map(b => b.bannedProfileId)
        .filter(Boolean) as string[];

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

    return (
        <div className="space-y-6">
            {/* Ban User Container */}
            <div className="flex flex-col bg-red-500/5 border border-red-500/10 p-5 rounded-2xl gap-4 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <ShieldAlert className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                            Ban Community Member
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                            Prevent a member from viewing, posting, or interacting within this community. Use this responsibly.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsBanModalOpen(true)}
                        disabled={isBanning}
                        variant="custom"
                        className="bg-red-600 hover:bg-red-700 text-white shrink-0 active:scale-95 transition-transform cursor-pointer h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border-0"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Ban Member
                    </Button>
                </div>

                {/* Step 2: Ban reason form — shown after selecting a member */}
                {selectedMember && (
                    <form onSubmit={handleConfirmBan} className="space-y-4 pt-4 mt-2 border-t border-red-500/15 animate-fade-in-up">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Banning member: <span className="font-semibold text-foreground ml-1">{selectedMember.fullName}</span>
                            </div>
                            <button
                                type="button"
                                className="text-[11px] text-muted-foreground hover:text-red-500 underline transition-colors cursor-pointer"
                                onClick={() => setSelectedMember(null)}
                            >
                                Cancel selection
                            </button>
                        </div>
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Provide a clear reason for the ban (optional)..."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="bg-background min-h-[80px] rounded-xl border border-border/60 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-500 transition-all duration-200"
                            />
                        </div>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="custom"
                                className="btn-secondary h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setSelectedMember(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="custom"
                                disabled={isBanning}
                                className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5 border-0"
                            >
                                {isBanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                                Confirm Permanent Ban
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Search ban list */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search banned users by name..."
                        className="pl-10 rounded-xl border border-border/60 bg-muted/10 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-background transition-all duration-200"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPageNumber(0);
                        }}
                    />
                </div>
            </div>

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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Loading bans...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : bans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    {debouncedSearch ? "No bans match your search." : "No banned users."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            bans.map((ban) => (
                                <TableRow key={ban.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <ManagementProfileCell
                                            profileId={ban.bannedProfileId}
                                            fullName={ban.bannedProfile?.fullName}
                                            avatarUrl={ban.bannedProfile?.avatarUrl}
                                            profilePreview={ban.bannedProfile}
                                            isRestricted={ban.isBannedProfileRestricted || ban.hasBlockedRelation}
                                            restrictedMessage={ban.restrictedMessage}
                                            labelFallback="Unknown User"
                                        />
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
                                            className="h-8 border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                                            onClick={() => unbanMember(ban.id)}
                                            disabled={ban.canUnban === false || isUnbanning}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-6 border-t border-border/20">
                    <Button
                        variant="outline"
                        className="h-9 px-3 text-xs rounded-lg hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                        disabled={pageNumber === 0}
                        onClick={() => setPageNumber(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">Page {pageNumber + 1} of {totalPages}</span>
                    <Button
                        variant="outline"
                        className="h-9 px-3 text-xs rounded-lg hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                        disabled={pageNumber >= totalPages - 1}
                        onClick={() => setPageNumber(p => p + 1)}
                    >
                        Next
                    </Button>
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
                mode="ban"
            />
        </div>
    );
}
