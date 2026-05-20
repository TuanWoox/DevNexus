"use client";

import React, { useState } from "react";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { ContentType } from "@/types/content-media/content-type";
import { ReportStatus } from "@/types/community-content-report/report-status";
import { useGetCommunityReportsAdmin } from "@/hooks/community-content-report-hooks/use-get-community-reports-admin";
import { useGetCommunityReportsUser } from "@/hooks/community-content-report-hooks/use-get-community-reports-user";
import { SelectCommunityPostsReportDTO } from "@/types/community-posts-report/select-community-posts-report-dto";
import { SelectCommunityQAPostReportsDTO } from "@/types/community-qa-post-reports/select-community-qa-post-reports-dto";
import { SelectCommunityAnswersReportDTO } from "@/types/community-answers-report/select-community-answers-report-dto";
import { SelectCommunityCommentsReportDTO } from "@/types/community-comments-report/select-community-comments-report-dto";
import { Page, OrderMapping } from "@/types/common/page";
import { SortOrderType } from "@/constants/sortOrderType";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, User, Search } from "lucide-react";
import { ReportFilterPanel } from "./report-filter-panel";
import { ReportTable } from "./report-table";
import { ReportInspectDrawer } from "./report-inspect-drawer";
import { ReportPagination } from "./report-pagination";

interface ReportsListContainerProps {
    community: SelectCommunityDTO;
}

export type AnyCommunityReportDTO =
    | SelectCommunityPostsReportDTO
    | SelectCommunityQAPostReportsDTO
    | SelectCommunityAnswersReportDTO
    | SelectCommunityCommentsReportDTO;

export function ReportsListContainer({ community }: ReportsListContainerProps) {
    const role = community.currentUserRole;
    const isModeratorOrOwner = role === "OWNER" || role === "MODERATOR";

    const [viewMode, setViewMode] = useState<"moderation" | "mine">(
        isModeratorOrOwner ? "moderation" : "mine"
    );

    const [contentType, setContentType] = useState<ContentType>(ContentType.Post);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState<AnyCommunityReportDTO | null>(null);
    const [sortField, setSortField] = useState<string>("DateCreated");
    const [sortDir, setSortDir] = useState<SortOrderType>(SortOrderType.DESC);

    const orders: OrderMapping[] = [
        {
            sort: sortField,
            sortDir: sortDir,
            dynamicProperty: "",
            delimiter: "",
            dataType: sortField === "DateCreated" ? "datetime" : "string",
        },
    ];

    const filterList = [];
    if (appliedSearch) {
        filterList.push({
            prop: "Reason",
            value: appliedSearch,
            filterType: FilterType.Text,
            filterOperator: FilterOperator.Contains,
            dynamicProperty: "",
            delimiter: "",
        });
    }
    if (statusFilter !== "ALL") {
        filterList.push({
            prop: "Status",
            value: statusFilter,
            filterType: FilterType.Number,
            filterOperator: FilterOperator.Equal,
            dynamicProperty: "",
            delimiter: "",
        });
    }

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders,
        filter: filterList,
        selected: [],
    };

    const adminQuery = useGetCommunityReportsAdmin<AnyCommunityReportDTO>(community.id, contentType, pagePayload);
    const userQuery = useGetCommunityReportsUser<AnyCommunityReportDTO>(community.id, contentType, pagePayload);

    const query = viewMode === "moderation" ? adminQuery : userQuery;
    const { data: pagedData, isLoading } = query;

    const reports = pagedData?.data ?? [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements ?? 0) / pagePayload.size);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchQuery);
        setPageNumber(0);
    };

    const handleContentTypeChange = (typeVal: string) => {
        setContentType(Number(typeVal) as ContentType);
        setPageNumber(0);
        setSelectedReport(null);
    };

    const handleStatusFilterChange = (statusVal: ReportStatus | "ALL") => {
        setStatusFilter(statusVal);
        setPageNumber(0);
        setSelectedReport(null);
    };

    const handleSortFieldChange = (field: string) => {
        setSortField(field);
        setPageNumber(0);
    };

    const handleSortDirChange = (dir: SortOrderType) => {
        setSortDir(dir);
        setPageNumber(0);
    };

    return (
        /* Dashboard shell — fills parent card height, no page scroll */
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">

            {/* ── Top Bar: View Mode Toggle (Mod/Owner only) ── */}
            {isModeratorOrOwner && (
                <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border bg-muted/25">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-lg px-4 h-8 cursor-pointer font-semibold text-xs transition-all duration-200 gap-2 ${
                                viewMode === "moderation"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                            }`}
                            onClick={() => { setViewMode("moderation"); setPageNumber(0); }}
                        >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Moderation Queue
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-lg px-4 h-8 cursor-pointer font-semibold text-xs transition-all duration-200 gap-2 ${
                                viewMode === "mine"
                                    ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                            }`}
                            onClick={() => { setViewMode("mine"); setPageNumber(0); }}
                        >
                            <User className="h-3.5 w-3.5" />
                            My Reports
                        </Button>
                    </div>

                    <Badge
                        variant="outline"
                        className="text-[11px] font-semibold text-muted-foreground border-border bg-muted/50 px-2.5 py-1 rounded-md"
                    >
                        Role: {role}
                    </Badge>
                </div>
            )}

            {/* ── Main Pane Grid: Sidebar + Content ── */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[260px_1fr]">

                {/* Left: Filter Sidebar — scrolls independently */}
                <aside className="hidden xl:flex flex-col border-r-2 border-border overflow-y-auto bg-muted/15">
                    <ReportFilterPanel
                        contentType={contentType}
                        onContentTypeChange={handleContentTypeChange}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusFilterChange}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSearchSubmit={handleSearchSubmit}
                        sortField={sortField}
                        onSortFieldChange={handleSortFieldChange}
                        sortDir={sortDir}
                        onSortDirChange={handleSortDirChange}
                    />
                </aside>

                {/* Right: Search + Table + Pagination — scrolls independently */}
                <div className="flex flex-col overflow-hidden">
                    {/* Search bar — pinned at top of right pane */}
                    <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/25">
                        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="report-search"
                                    placeholder="Search reports by reason..."
                                    className="pl-9 h-9 rounded-lg border-border bg-card text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                id="report-search-submit"
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-lg px-4 border-border bg-card hover:bg-primary/5 hover:border-primary/50 hover:text-primary text-xs font-semibold cursor-pointer transition-all gap-1.5 shadow-sm"
                            >
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </form>

                        {/* Mobile: filter summary pills */}
                        {statusFilter !== "ALL" && (
                            <Badge
                                variant="outline"
                                className="hidden sm:inline-flex text-[11px] border-primary/30 bg-primary/5 text-primary"
                            >
                                {statusFilter}
                            </Badge>
                        )}
                    </div>

                    {/* Table — flex-1, scrolls internally */}
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        <ReportTable
                            reports={reports}
                            contentType={contentType}
                            isLoading={isLoading}
                            onInspect={setSelectedReport}
                        />
                    </div>

                    {/* Pagination — pinned at bottom of right pane */}
                    {totalPages > 1 && (
                        <div className="shrink-0 border-t border-border px-5 py-3.5 bg-muted/25">
                            <ReportPagination
                                pageNumber={pageNumber}
                                totalPages={totalPages}
                                onPageChange={setPageNumber}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Inspect Drawer */}
            <ReportInspectDrawer
                report={selectedReport}
                contentType={contentType}
                onClose={() => setSelectedReport(null)}
            />
        </div>
    );
}
