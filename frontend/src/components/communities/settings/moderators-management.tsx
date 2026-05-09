"use client";

import { useGetCommunityModerators } from "@/hooks/community-moderators-hooks/use-get-community-moderators";
import { useRemoveCommunityModerator } from "@/hooks/community-moderators-hooks/use-remove-community-moderator";
import { useAddCommunityModerator } from "@/hooks/community-moderators-hooks/use-add-community-moderator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, UserMinus, UserPlus, Search } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityModeratorDTO } from "@/types/community-moderator/create-community-moderator-dto";
import { MemberSearchModal } from "./member-search-modal";
import Link from "next/link";
import Image from "next/image";

interface ModeratorsManagementProps {
    community: SelectCommunityDTO;
}

export function ModeratorsManagement({ community }: ModeratorsManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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

    const { data: pagedData, isLoading } = useGetCommunityModerators(community.id, pagePayload);
    const { mutate: removeModerator, isPending: isRemoving } = useRemoveCommunityModerator();
    const { mutate: addModerator, isPending: isAdding } = useAddCommunityModerator();

    const moderators = pagedData?.data ?? [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements ?? 0) / pagePayload.size);

    // Build list of already-moderator profileIds for the modal to highlight
    const existingModProfileIds = moderators
        .map(m => m.moderatorProfile?.id)
        .filter(Boolean) as string[];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    const handleMemberSelected = (profileId: string) => {
        const payload: CreateCommunityModeratorDTO = {
            moderatorId: profileId,
            communityId: community.id,
        };
        addModerator(payload);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Add Moderator via modal */}
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                    <h3 className="text-sm font-medium">Add New Moderator</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Search for a community member to promote to moderator.
                    </p>
                </div>
                <Button
                    onClick={() => setIsSearchModalOpen(true)}
                    disabled={isAdding}
                    variant="custom"
                    className="btn-primary text-white shrink-0"
                >
                    {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Add Moderator
                </Button>
            </div>

            {/* Search moderator list */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search moderators by name..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" variant="custom" className="btn-secondary">Search</Button>
            </form>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Moderator</TableHead>
                            <TableHead className="font-semibold">Date Added</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {moderators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    {appliedSearch ? "No moderators match your search." : "No moderators found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            moderators.map((mod) => (
                                <TableRow key={mod.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <Link
                                            href={`/profile/${mod.moderatorProfile?.id ?? mod.id}`}
                                            className="flex items-center gap-3 group w-fit"
                                        >
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                                                {mod.moderatorProfile?.avatarUrl ? (
                                                    <Image
                                                        src={mod.moderatorProfile.avatarUrl}
                                                        alt={mod.moderatorProfile.fullName ?? "Moderator"}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                                                        {(mod.moderatorProfile?.fullName ?? "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm group-hover:text-primary transition-colors">
                                                    {mod.moderatorProfile?.fullName || "Unknown User"}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">View profile →</span>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {mod.dateCreated ? new Date(mod.dateCreated).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                            onClick={() => removeModerator(mod.id)}
                                            disabled={isRemoving}
                                        >
                                            <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
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

            {/* Member Search Modal */}
            <MemberSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleMemberSelected}
                communityId={community.id}
                title="Select Member to Promote"
                description="Search community members by name. Only existing members can be promoted to moderator."
                highlightedIds={existingModProfileIds}
            />
        </div>
    );
}
