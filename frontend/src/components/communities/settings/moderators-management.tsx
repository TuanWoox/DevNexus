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
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityModeratorDTO } from "@/types/community-moderator/create-community-moderator-dto";

interface ModeratorsManagementProps {
    community: SelectCommunityDTO;
}

export function ModeratorsManagement({ community }: ModeratorsManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [newModUserId, setNewModUserId] = useState("");

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
                prop: "Profile.FullName", // Adjust based on actual backend property name
                value: appliedSearch,
                filterType: FilterType.Text,
                filterOperator: 0,
                dynamicProperty: "",
                delimiter: ""
            }
        ] : [],
        selected: []
    };

    const { data: pagedData, isLoading } = useGetCommunityModerators(community.id, pagePayload);
    const { mutate: removeModerator, isPending: isRemoving } = useRemoveCommunityModerator();
    const { mutate: addModerator, isPending: isAdding } = useAddCommunityModerator();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    const handleAddModerator = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModUserId.trim()) return;

        const payload: CreateCommunityModeratorDTO = {
            moderatorId: newModUserId.trim(),
            communityId: community.id
        }

        addModerator(payload);
        setNewModUserId("");
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const moderators = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / pagePayload.size);

    return (
        <div className="space-y-6">
            {/* Add Moderator */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <h3 className="text-sm font-medium mb-3">Add New Moderator</h3>
                <form onSubmit={handleAddModerator} className="flex items-center gap-2 max-w-md">
                    <Input
                        placeholder="Enter User ID..."
                        value={newModUserId}
                        onChange={(e) => setNewModUserId(e.target.value)}
                        className="bg-background"
                    />
                    <Button type="submit" disabled={isAdding || !newModUserId.trim()} variant="custom" className="btn-primary text-white">
                        {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        Add
                    </Button>
                </form>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search moderators..."
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
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{mod.moderatorProfile?.fullName || "Unknown User"}</span>
                                            {/* Chỗ này nên để email của user thay vì userId */}
                                            {/* <span className="text-xs text-muted-foreground font-normal">@{mod.userId.split('-')[0]}</span> */}
                                        </div>
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
