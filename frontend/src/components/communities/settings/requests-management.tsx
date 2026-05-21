"use client";

import { useGetCommunityRequests } from "@/hooks/community-requests-hooks/use-get-community-requests";
import { useApproveRequest } from "@/hooks/community-requests-hooks/use-approve-request";
import { useRejectRequest } from "@/hooks/community-requests-hooks/use-reject-request";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Check, X, Search } from "lucide-react";
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
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const requests = pagedData?.data || [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements || 0) / pagePayload.size);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
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
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Date Requested</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    {appliedSearch ? "No requests match your search." : "No pending membership requests."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/profile/${req.requesterId}`}
                                            className="flex items-center gap-3 group w-fit"
                                        >
                                            <UserAvatar
                                                avatarUrl={req.requester?.avatarUrl}
                                                fullName={req.requester?.fullName ?? "User"}
                                                className="w-8 h-8 shrink-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm group-hover:text-primary transition-colors">
                                                    {req.requester?.fullName || "Unknown User"}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">View profile →</span>
                                            </div>
                                        </Link>
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
                                                disabled={isProcessing}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                                                onClick={() => rejectRequest(req.id)}
                                                disabled={isProcessing}
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
