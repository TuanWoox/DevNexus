"use client";

import { useState, useEffect } from "react";
import { useGetCommunitiesWithPagination } from "@/hooks/community-hooks/use-get-communities-with-pagination";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { CommunityCard } from "./community-card";
import { ExploreHeader, SORT_OPTIONS, SortOption } from "./explore-header";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FilterOperator } from "@/constants/filterOperator";

export function CommunitiesList() {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [currentSort, setCurrentSort] = useState<SortOption>(SORT_OPTIONS[0]);

    // Construct the payload for the API
    const payload: Page<string> = {
        size: 12,
        pageNumber,
        totalElements: 0,
        orders: [
            {
                sort: currentSort.sort,
                sortDir: currentSort.sortDir,
                dynamicProperty: "",
                delimiter: "",
                dataType: "string"
            }
        ],
        filter: appliedSearch ? [
            {
                prop: "Name",
                value: appliedSearch,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: ""
            }
        ] : [],
        selected: []
    };

    const { data: pagedData, isLoading, isError } = useGetCommunitiesWithPagination(payload);

    const handleSearchSubmit = () => {
        setAppliedSearch(searchQuery);
        setPageNumber(0); // Reset to first page on search
    };

    // Reset to first page when sort changes
    useEffect(() => {
        setPageNumber(0);
    }, [currentSort]);

    const items = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / payload.size);

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto">
            <ExploreHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                onSearchSubmit={handleSearchSubmit}
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Discovering communities...</p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center bg-red-500/10 rounded-2xl border border-red-500/20">
                    <p className="text-red-500 font-semibold mb-2">Failed to load communities.</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center bg-card/50 rounded-2xl border border-dashed">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-3xl">
                        🔍
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No communities found</h3>
                    <p className="text-muted-foreground max-w-md">
                        We couldn&apos;t find any communities matching your search criteria. Try a different keyword or create one yourself!
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 fade-in">
                        {items.map((community) => (
                            <CommunityCard key={community.id} community={community} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12 pt-6 border-t pb-10">
                            <Button
                                variant="outline"
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
                                disabled={pageNumber >= totalPages - 1}
                                onClick={() => setPageNumber(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
