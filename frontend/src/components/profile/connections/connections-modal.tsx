"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { FollowersTab } from "./followers-tab";
import { FollowingTab } from "./following-tab";
import { RequestsTab } from "./requests-tab";

export type ConnectionsTabValue = "followers" | "following" | "requests";

interface ConnectionsModalProps {
    open: boolean;
    onClose: () => void;
    profileId: string;
    isOwnProfile: boolean;
    initialTab?: ConnectionsTabValue;
    followerCount?: number;
    followingCount?: number;
}

export function ConnectionsModal({
    open,
    onClose,
    profileId,
    isOwnProfile,
    initialTab = "followers",
    followerCount = 0,
    followingCount = 0,
}: ConnectionsModalProps) {
    const [activeTab, setActiveTab] = useState<ConnectionsTabValue>(initialTab);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Reset search when tab changes
    const switchTab = (tab: ConnectionsTabValue) => {
        setActiveTab(tab);
        setSearchTerm("");
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl h-[90vh] p-0 flex flex-col gap-0" showCloseButton={false}>
                {/* Header */}
                <DialogHeader className="p-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold text-foreground">
                            Connections
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full cursor-pointer"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => switchTab("followers")}
                            className={cn(
                                "flex-1 min-w-[80px] px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap",
                                activeTab === "followers"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            Followers
                            <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs font-normal opacity-70">
                                {followerCount}
                            </span>
                        </button>
                        <button
                            onClick={() => switchTab("following")}
                            className={cn(
                                "flex-1 min-w-[80px] px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap",
                                activeTab === "following"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            Following
                            <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs font-normal opacity-70">
                                {followingCount}
                            </span>
                        </button>
                        {isOwnProfile && (
                            <button
                                onClick={() => switchTab("requests")}
                                className={cn(
                                    "flex-1 min-w-[80px] px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap",
                                    activeTab === "requests"
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Requests
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="flex-1 p-3 sm:px-6 sm:pt-6 sm:pb-4">
                    {activeTab === "followers" && (
                        <FollowersTab
                            profileId={profileId}
                            isOwnProfile={isOwnProfile}
                            searchTerm={debouncedSearch}
                        />
                    )}
                    {activeTab === "following" && (
                        <FollowingTab
                            profileId={profileId}
                            isOwnProfile={isOwnProfile}
                            searchTerm={debouncedSearch}
                        />
                    )}
                    {activeTab === "requests" && isOwnProfile && (
                        <RequestsTab searchTerm={debouncedSearch} />
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
