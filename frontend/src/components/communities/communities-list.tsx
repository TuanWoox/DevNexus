"use client";

import { useState } from "react";
import { CommunityFetchMode } from "@/constants/communityFetchMode";
import { ExploreHeader, SORT_OPTIONS, SortOption } from "./explore-header";
import { CommunityTabs } from "./community-tabs";
import { CommunityTabContent } from "./community-tab-content";
import { Button } from "../ui/button";

export function CommunitiesList() {
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [currentSort, setCurrentSort] = useState<SortOption>(SORT_OPTIONS[0]);
    const [activeTab, setActiveTab] = useState<CommunityFetchMode>(CommunityFetchMode.EXPLORE);

    const isSearching = appliedSearch.trim().length > 0;

    const handleSearchSubmit = () => {
        setAppliedSearch(searchQuery);
    };

    const handleSearchClear = () => {
        setSearchQuery("");
        setAppliedSearch("");
    };

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
            <ExploreHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                onSearchSubmit={handleSearchSubmit}
            />

            {/* Hide tabs when searching globally — show results across all modes instead */}
            {!isSearching && (
                <CommunityTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            )}

            <div className="fade-in">
                {isSearching ? (
                    /* Global search: show results from EXPLORE mode with the search query */
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-heading">
                                Search results for &ldquo;{appliedSearch}&rdquo;
                            </h2>
                            <Button variant="custom" className="btn-secondary" onClick={handleSearchClear}>
                                Clear search
                            </Button>
                        </div>
                        <CommunityTabContent
                            key={`global-search-${appliedSearch}-${currentSort.sort}`}
                            mode={CommunityFetchMode.ALL}
                            searchQuery={appliedSearch}
                            sortOption={currentSort}
                        />
                    </div>
                ) : (
                    <CommunityTabContent
                        key={`${activeTab}-${appliedSearch}-${currentSort.sort}`}
                        mode={activeTab}
                        searchQuery={appliedSearch}
                        sortOption={currentSort}
                    />
                )}
            </div>
        </div>
    );
}
