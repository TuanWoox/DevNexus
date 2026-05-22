"use client";

import { useGetCommunityRequests } from "@/hooks/community-requests-hooks/use-get-community-requests";
import { useApproveRequest } from "@/hooks/community-requests-hooks/use-approve-request";
import { useRejectRequest } from "@/hooks/community-requests-hooks/use-reject-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Check, X, Search, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { SortOrderType } from "@/constants/sortOrderType";
import { FilterOperator } from "@/constants/filterOperator";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";

interface RequestsManagementProps {
    community: SelectCommunityDTO;
}

export function RequestsManagement({ community }: RequestsManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Page model mapping
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
                prop: "Requester.FullName",
                value: appliedSearch,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: ""
            }
        ] : [],
        selected: []
    };

    const { data: pagedData, isLoading } = useGetCommunityRequests(community.id, pagePayload);
    const { mutate: approveRequest, isPending: isApproving } = useApproveRequest();
    const { mutate: rejectRequest, isPending: isRejecting } = useRejectRequest();

    const isProcessing = isApproving || isRejecting;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const requests = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / pagePayload.size);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by requester name..."
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

            {/* Request Card Stream */}
            <div className="space-y-3.5">
                {requests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/5 p-12 text-center flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground/60 mb-3" />
                        <h4 className="text-sm font-semibold text-foreground">No requests found</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                            {appliedSearch ? "No membership requests match your search criteria." : "There are currently no pending membership requests for this community."}
                        </p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div 
                            key={req.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/5 hover:border-border/60 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-4 hover:shadow-xs"
                        >
                            {/* Left: User Profile Info */}
                            <Link
                                href={`/profile/${req.requesterId}`}
                                className="flex items-center gap-3.5 group cursor-pointer"
                            >
                                <UserAvatar
                                    avatarUrl={req.requester?.avatarUrl}
                                    fullName={req.requester?.fullName ?? "User"}
                                    className="w-10 h-10 shrink-0 rounded-full border border-border/40 group-hover:border-primary/20 transition-colors"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                        {req.requester?.fullName || "Unknown User"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        Requested {req.dateCreated ? new Date(req.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                    </span>
                                </div>
                            </Link>

                            {/* Right: Modern Actions */}
                            <div className="flex items-center gap-2.5 sm:self-center self-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 rounded-lg border border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 hover:border-emerald-500 active:scale-[0.97] transition-all duration-150 cursor-pointer font-semibold text-xs flex items-center gap-1.5"
                                    onClick={() => approveRequest(req.id)}
                                    disabled={isProcessing}
                                >
                                    <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 rounded-lg border border-red-500/20 text-red-600 bg-red-500/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 hover:border-red-500 active:scale-[0.97] transition-all duration-150 cursor-pointer font-semibold text-xs flex items-center gap-1.5"
                                    onClick={() => rejectRequest(req.id)}
                                    disabled={isProcessing}
                                >
                                    <X className="h-3.5 w-3.5" /> Reject
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
                        onClick={() => setPageNumber(prev => prev - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">
                        Page {pageNumber + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        className="h-9 px-3 text-xs rounded-lg hover:bg-muted active:scale-95 transition-transform cursor-pointer"
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
