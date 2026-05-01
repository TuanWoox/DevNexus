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
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityBanDTO } from "@/types/community-bans/create-community-ban-dto";

interface BansManagementProps {
    community: SelectCommunityDTO;
}

export function BansManagement({ community }: BansManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Ban form state
    const [banUserId, setBanUserId] = useState("");
    const [banReason, setBanReason] = useState("");

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders: [
            {
                sort: "DateCreated",
                sortDir: SortOrderType.DESC,
                dynamicProperty: "",
                delimiter: "",
                dataType: "datetime"
            }
        ],
        filter: appliedSearch ? [
            {
                prop: "Profile.FullName",
                value: appliedSearch,
                filterType: FilterType.Text,
                filterOperator: 0,
                dynamicProperty: "",
                delimiter: ""
            }
        ] : [],
        selected: []
    };

    const { data: pagedData, isLoading } = useGetCommunityBans(community.id, pagePayload);
    const { mutate: unbanMember, isPending: isUnbanning } = useUnbanCommunityMember();
    const { mutate: banMember, isPending: isBanning } = useBanCommunityMember();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    const handleBanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!banUserId.trim()) return;

        const payload: CreateCommunityBanDTO = {
            communityId: community.id,
            bannedProfileId: banUserId.trim(),
            banReason: banReason.trim()
        }

        banMember(payload);
        setBanUserId("");
        setBanReason("");
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const bans = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / pagePayload.size);

    return (
        <div className="space-y-6">
            {/* Add Ban */}
            <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                <h3 className="text-sm font-medium mb-3 text-red-600 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Ban User
                </h3>
                <form onSubmit={handleBanSubmit} className="space-y-3 max-w-md">
                    <Input
                        placeholder="Enter User ID to ban..."
                        value={banUserId}
                        onChange={(e) => setBanUserId(e.target.value)}
                        className="bg-background"
                        required
                    />
                    <Textarea
                        placeholder="Reason (optional)..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="bg-background min-h-[60px]"
                    />
                    <Button type="submit" variant="destructive" disabled={isBanning || !banUserId.trim()} className="w-full">
                        {isBanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Ban User"}
                    </Button>
                </form>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search banned users..."
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
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{ban.bannedProfile?.fullName || "Unknown User"}</span>
                                            {/* <span className="text-xs text-muted-foreground font-normal">@{ban.userId.split('-')[0]}</span> */}
                                        </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber === 0}
                        onClick={() => setPageNumber(prev => prev - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium">
                        Page {pageNumber + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber >= totalPages - 1}
                        onClick={() => setPageNumber(prev => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
