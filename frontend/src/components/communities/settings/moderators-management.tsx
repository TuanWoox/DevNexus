"use client";

import { useGetCommunityModerators } from "@/hooks/community-moderators-hooks/use-get-community-moderators";
import { useRemoveCommunityModerator } from "@/hooks/community-moderators-hooks/use-remove-community-moderator";
import { useAddCommunityModerator } from "@/hooks/community-moderators-hooks/use-add-community-moderator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, UserMinus, UserPlus, Search, Calendar, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityModeratorDTO } from "@/types/community-moderator/create-community-moderator-dto";
import { MemberSearchModal } from "./member-search-modal";
import { ManagementProfileCell } from "./management-profile-cell";
import { useDebounce } from "@/hooks/use-debounce";

interface ModeratorsManagementProps {
    community: SelectCommunityDTO;
}

export function ModeratorsManagement({ community }: ModeratorsManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const debouncedSearch = useDebounce(searchQuery.trim(), 400);

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders: [{ sort: "DateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "datetime" }],
        filter: debouncedSearch ? [
            {
                prop: "Moderator.FullName",
                value: debouncedSearch,
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
        .map(m => m.moderatorId)
        .filter(Boolean) as string[];

    const handleMemberSelected = (profileId: string) => {
        const payload: CreateCommunityModeratorDTO = {
            moderatorId: profileId,
            communityId: community.id,
        };
        addModerator(payload);
    };

    return (
        <div className="space-y-6">
            {/* Add Moderator via modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-primary/5 border border-primary/10 p-5 rounded-2xl gap-4">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Add New Moderator
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Promote an existing member of your community to a moderator role to help manage content, requests, and bans.
                    </p>
                </div>
                <Button
                    onClick={() => setIsSearchModalOpen(true)}
                    disabled={isAdding}
                    variant="custom"
                    className="btn-primary text-white shrink-0 active:scale-95 transition-transform cursor-pointer h-10 px-4 rounded-xl text-xs font-semibold"
                >
                    {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Promote Member
                </Button>
            </div>

            {/* Search moderator list */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search moderators by name..."
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
                            <TableHead className="font-semibold">Moderator</TableHead>
                            <TableHead className="font-semibold">Date Added</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Loading moderators...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : moderators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    {debouncedSearch ? "No moderators match your search." : "No moderators found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            moderators.map((mod) => (
                                <TableRow key={mod.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <ManagementProfileCell
                                            profileId={mod.moderatorId}
                                            fullName={mod.moderatorProfile?.fullName}
                                            avatarUrl={mod.moderatorProfile?.avatarUrl}
                                            profilePreview={mod.moderatorProfile}
                                            isRestricted={mod.isProfileRestricted || mod.hasBlockedRelation}
                                            restrictedMessage={mod.restrictedMessage}
                                            labelFallback="Unknown User"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {mod.dateCreated ? new Date(mod.dateCreated).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                                            onClick={() => removeModerator(mod.id)}
                                            disabled={mod.canDemote === false || isRemoving}
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

            {/* Member Search Modal */}
            <MemberSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleMemberSelected}
                communityId={community.id}
                title="Select Member to Promote"
                description="Search community members by name. Only existing members can be promoted to moderator."
                highlightedIds={existingModProfileIds}
                mode="promote"
            />
        </div>
    );
}
