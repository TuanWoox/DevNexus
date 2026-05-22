"use client";

import { useGetCommunityRequests } from "@/hooks/community-requests-hooks/use-get-community-requests";
import { useApproveRequest } from "@/hooks/community-requests-hooks/use-approve-request";
import { useRejectRequest } from "@/hooks/community-requests-hooks/use-reject-request";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Check, X, Search, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { SortOrderType } from "@/constants/sortOrderType";
import { FilterOperator } from "@/constants/filterOperator";
import { ManagementProfileCell } from "./management-profile-cell";
import { useDebounce } from "@/hooks/use-debounce";

interface RequestsManagementProps {
    community: SelectCommunityDTO;
}

export function RequestsManagement({ community }: RequestsManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery.trim(), 400);

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
        filter: debouncedSearch ? [
            {
                prop: "Requester.FullName",
                value: debouncedSearch,
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

    const requests = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / pagePayload.size);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by requester name..."
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
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Date Requested</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Loading requests...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    {debouncedSearch ? "No requests match your search." : "No pending membership requests."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <ManagementProfileCell
                                            profileId={req.requesterId}
                                            fullName={req.requester?.fullName}
                                            avatarUrl={req.requester?.avatarUrl}
                                            profilePreview={req.requester}
                                            isRestricted={req.isProfileRestricted || req.hasBlockedRelation}
                                            restrictedMessage={req.restrictedMessage}
                                            labelFallback="Unknown User"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {req.dateCreated ? new Date(req.dateCreated).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                                                onClick={() => approveRequest(req.id)}
                                                disabled={req.canApprove === false || isProcessing}
                                                title={req.canApprove === false ? "Cannot approve because this profile is unavailable due to a block relationship." : undefined}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                                                onClick={() => rejectRequest(req.id)}
                                                disabled={req.canReject === false || isProcessing}
                                            >
                                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                                            </Button>
                                        </div>
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
