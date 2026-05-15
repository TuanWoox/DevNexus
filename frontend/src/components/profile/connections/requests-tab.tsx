"use client";

import { useState, useCallback } from "react";
import { ConnectionCard } from "./connection-card";
import { ConnectionCardSkeletonList } from "./connection-card-skeleton";
import {
    useGetReceivedFollowRequests,
    useGetSentFollowRequests,
    useApproveRequest,
    useRejectRequest,
    useCancelRequest,
    useBulkApproveRequests,
    useBulkRejectRequests,
    useBulkCancelRequests,
} from "@/hooks/follow-request-hooks";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestsTabProps {
    searchTerm: string;
}

type SubTab = "received" | "sent";

export function RequestsTab({ searchTerm }: RequestsTabProps) {
    const [subTab, setSubTab] = useState<SubTab>("received");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Reset selection on sub-tab switch
    const switchSubTab = (tab: SubTab) => {
        setSubTab(tab);
        setSelectedIds([]);
    };

    return (
        <div className="space-y-4">
            {/* Sub-tab toggle */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                <button
                    onClick={() => switchSubTab("received")}
                    className={cn(
                        "flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
                        subTab === "received"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Received
                </button>
                <button
                    onClick={() => switchSubTab("sent")}
                    className={cn(
                        "flex-1 px-2 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
                        subTab === "sent"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Sent
                </button>
            </div>

            {subTab === "received" ? (
                <ReceivedRequests
                    searchTerm={searchTerm}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                />
            ) : (
                <SentRequests
                    searchTerm={searchTerm}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                />
            )}
        </div>
    );
}

// ─── Received Requests ─────────────────────────────────────
interface RequestListProps {
    searchTerm: string;
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

function ReceivedRequests({ searchTerm, selectedIds, setSelectedIds }: RequestListProps) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
        useGetReceivedFollowRequests(searchTerm);

    const approveRequest = useApproveRequest();
    const rejectRequest = useRejectRequest();
    const bulkApprove = useBulkApproveRequests();
    const bulkReject = useBulkRejectRequests();

    const requests = data?.pages.flatMap((page) => page.data) ?? [];

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const sentinelRef = useIntersectionObserver(handleLoadMore);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === requests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requests.map((r) => r.id));
        }
    };

    if (isLoading) return <ConnectionCardSkeletonList />;

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">{searchTerm ? "No requests found" : "No pending requests"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Bulk actions */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <Checkbox
                        checked={selectedIds.length === requests.length}
                        onCheckedChange={toggleSelectAll}
                        className="cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium">{selectedIds.length} selected</span>
                    <div className="ml-auto flex gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => { bulkApprove.mutate(selectedIds); setSelectedIds([]); }}
                            disabled={bulkApprove.isPending}
                            className="cursor-pointer"
                        >
                            <Check className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Accept</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { bulkReject.mutate(selectedIds); setSelectedIds([]); }}
                            disabled={bulkReject.isPending}
                            className="cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Reject</span>
                        </Button>
                    </div>
                </div>
            )}

            {requests.map((request) => {
                const profile = request.requesterProfile;
                if (!profile) return null;
                return (
                    <ConnectionCard
                        key={request.id}
                        profile={profile}
                        showCheckbox
                        selected={selectedIds.includes(request.id)}
                        onSelect={() => toggleSelect(request.id)}
                        actionLabel={<><Check className="h-4 w-4" /><span className="hidden sm:inline ml-1">Accept</span></>}
                        actionVariant="default"
                        onAction={() => approveRequest.mutate(request.id)}
                        actionPending={approveRequest.isPending}
                        secondaryActionLabel={<><X className="h-4 w-4" /><span className="hidden sm:inline ml-1">Decline</span></>}
                        secondaryActionVariant="destructive"
                        onSecondaryAction={() => rejectRequest.mutate(request.id)}
                        secondaryActionPending={rejectRequest.isPending}
                    />
                );
            })}

            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {isFetchingNextPage && (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                )}
            </div>

            {!hasNextPage && requests.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">No more requests</p>
            )}
        </div>
    );
}

// ─── Sent Requests ─────────────────────────────────────
function SentRequests({ searchTerm, selectedIds, setSelectedIds }: RequestListProps) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
        useGetSentFollowRequests(searchTerm);

    const cancelRequest = useCancelRequest();
    const bulkCancel = useBulkCancelRequests();

    const requests = data?.pages.flatMap((page) => page.data) ?? [];

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const sentinelRef = useIntersectionObserver(handleLoadMore);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === requests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requests.map((r) => r.id));
        }
    };

    if (isLoading) return <ConnectionCardSkeletonList />;

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">{searchTerm ? "No requests found" : "No sent requests"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Bulk actions */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <Checkbox
                        checked={selectedIds.length === requests.length}
                        onCheckedChange={toggleSelectAll}
                        className="cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium">{selectedIds.length} selected</span>
                    <div className="ml-auto">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { bulkCancel.mutate(selectedIds); setSelectedIds([]); }}
                            disabled={bulkCancel.isPending}
                        >
                            <X className="h-4 w-4 mr-1" /> Cancel All
                        </Button>
                    </div>
                </div>
            )}

            {requests.map((request) => {
                const profile = request.targetProfile;
                if (!profile) return null;
                return (
                    <ConnectionCard
                        key={request.id}
                        profile={profile}
                        showCheckbox
                        selected={selectedIds.includes(request.id)}
                        onSelect={() => toggleSelect(request.id)}
                        actionLabel="Cancel"
                        actionVariant="outline"
                        onAction={() => cancelRequest.mutate(request.id)}
                        actionPending={cancelRequest.isPending}
                    />
                );
            })}

            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {isFetchingNextPage && (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                )}
            </div>

            {!hasNextPage && requests.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">No more requests</p>
            )}
        </div>
    );
}
