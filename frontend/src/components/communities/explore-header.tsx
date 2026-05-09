"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import { SortOrderType } from "@/constants/sortOrderType";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCommunityModal } from "./create-community-modal";

export type SortOption = {
    sort: string;
    sortDir: SortOrderType;
    label: string;
};

export const SORT_OPTIONS: SortOption[] = [
    { sort: "dateCreated", sortDir: SortOrderType.DESC, label: "Latest" },
    { sort: "dateCreated", sortDir: SortOrderType.ASC, label: "Oldest" },
    { sort: "name", sortDir: SortOrderType.ASC, label: "Name (A-Z)" },
    { sort: "name", sortDir: SortOrderType.DESC, label: "Name (Z-A)" },
];

interface ExploreHeaderProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    currentSort: SortOption;
    setCurrentSort: (sort: SortOption) => void;
    onSearchSubmit: () => void;
}

export function ExploreHeader({
    searchQuery,
    setSearchQuery,
    currentSort,
    setCurrentSort,
    onSearchSubmit
}: ExploreHeaderProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between fade-in">
            <div className="flex-1 flex gap-2 w-full max-w-md relative">
                <Input
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Button variant="custom" className="btn-secondary" onClick={onSearchSubmit}>
                    Search
                </Button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="custom" className="btn-secondary gap-2">
                            <Filter className="w-4 h-4" />
                            {currentSort.label}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {SORT_OPTIONS.map((option, idx) => (
                            <DropdownMenuItem
                                key={idx}
                                onClick={() => setCurrentSort(option)}
                                className={currentSort.label === option.label ? "bg-muted" : ""}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button className="btn-ai text-white gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create
                </Button>
            </div>

            <CreateCommunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
