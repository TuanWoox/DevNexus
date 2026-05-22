"use client";

import { useGetCommunityModerators } from "@/hooks/community-moderators-hooks/use-get-community-moderators";
import { useRemoveCommunityModerator } from "@/hooks/community-moderators-hooks/use-remove-community-moderator";
import { useAddCommunityModerator } from "@/hooks/community-moderators-hooks/use-add-community-moderator";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";

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
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Add Moderator via modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-primary/5 border border-primary/10 p-5 rounded-2xl gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Add New Moderator
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
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
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search moderators by name..."
                        className="pl-10 rounded-xl border border-border/60 bg-muted/10 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-background transition-all duration-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button 
                    type="submit" 
                    variant="custom" 
                    className="btn-secondary h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform shrink-0"
                >
                    Search
                </Button>
            </form>

            {/* Moderator Cards Stream */}
            <div className="space-y-3.5">
                {moderators.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/5 p-12 text-center flex flex-col items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-muted-foreground/60 mb-3" />
                        <h4 className="text-sm font-semibold text-foreground">No moderators found</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                            {appliedSearch ? "No moderators match your search criteria." : "No moderators currently exist for this community besides yourself."}
                        </p>
                    </div>
                ) : (
                    moderators.map((mod) => (
                        <div 
                            key={mod.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/5 hover:border-border/60 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-4 hover:shadow-xs"
                        >
                            {/* Left: User Avatar & Info */}
                            <Link
                                href={`/profile/${mod.moderatorProfile?.id ?? mod.id}`}
                                className="flex items-center gap-3.5 group cursor-pointer"
                            >
                                <UserAvatar
                                    avatarUrl={mod.moderatorProfile?.avatarUrl}
                                    fullName={mod.moderatorProfile?.fullName ?? "Moderator"}
                                    className="w-10 h-10 shrink-0 rounded-full border border-border/40 group-hover:border-primary/20 transition-colors"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                        {mod.moderatorProfile?.fullName || "Unknown User"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        Added {mod.dateCreated ? new Date(mod.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                    </span>
                                </div>
                            </Link>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2.5 sm:self-center self-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 rounded-lg border border-red-500/20 text-red-600 bg-red-500/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 hover:border-red-500 active:scale-[0.97] transition-all duration-150 cursor-pointer font-semibold text-xs flex items-center gap-1.5"
                                    onClick={() => removeModerator(mod.id)}
                                    disabled={isRemoving}
                                >
                                    <UserMinus className="h-3.5 w-3.5" /> Remove Role
                                </Button>
                            </div>
                        </div>
                    ))
                )}
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
            />
        </div>
    );
}
