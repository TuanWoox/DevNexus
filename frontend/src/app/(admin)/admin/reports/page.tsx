"use client";

import { useMemo, useState } from "react";
import {
  AdminReportsTable,
  AdminReportTabValue,
  reportTabStatuses,
} from "@/components/admin/reports/admin-reports-table";
import { useGetAdminReports } from "@/hooks/admin/use-get-admin-reports";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { FilterMapping, Page } from "@/types/common/page";
import { SortOrderType } from "@/constants/sortOrderType";
import { ReportsStatusTabs } from "@/components/admin/reports/reports-status-tabs";
import { ReportsToolbar } from "@/components/admin/reports/reports-toolbar";
import { ReportsPagination } from "@/components/admin/reports/reports-pagination";
import { RefreshCw } from "lucide-react";

const DEFAULT_PAGE_SIZE = 20;
const ALL_FILTER = "all";

function buildStatusFilter(tab: AdminReportTabValue): FilterMapping[] {
  const statuses = reportTabStatuses[tab];
  if (!statuses.length) return [];

  return [{
    prop: "status",
    value: statuses.length === 1 ? statuses[0] : statuses.join(","),
    filterOperator: statuses.length === 1 ? FilterOperator.Equal : FilterOperator.Contains,
    filterType: statuses.length === 1 ? FilterType.Number : FilterType.DropDown,
    dynamicProperty: "",
    delimiter: "",
  }];
}

function buildFilter(
  prop: string,
  value: string | number,
  filterOperator: FilterOperator,
  filterType: FilterType,
): FilterMapping {
  return { prop, value, filterOperator, filterType, dynamicProperty: "", delimiter: "" };
}

function buildPage(
  pageNumber: number,
  tab: AdminReportTabValue,
  searchTerm: string,
  targetType: string,
  targetAction: string,
  sortDirection: SortOrderType,
): Page<string> {
  const filters = buildStatusFilter(tab);
  const normalizedSearch = searchTerm.trim();

  if (normalizedSearch) {
    filters.push(buildFilter("description", normalizedSearch, FilterOperator.Contains, FilterType.Text));
  }

  if (targetType !== ALL_FILTER) {
    filters.push(buildFilter("targetType", Number(targetType), FilterOperator.Equal, FilterType.Number));
  }

  if (targetAction !== ALL_FILTER) {
    filters.push(buildFilter("targetAction", Number(targetAction), FilterOperator.Equal, FilterType.Number));
  }

  return {
    pageNumber,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    orders: [{ sort: "dateCreated", sortDir: sortDirection, dynamicProperty: "", delimiter: "", dataType: "" }],
    filter: filters,
    selected: [],
  };
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<AdminReportTabValue>("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [targetType, setTargetType] = useState(ALL_FILTER);
  const [targetAction, setTargetAction] = useState(ALL_FILTER);
  const [sortDirection, setSortDirection] = useState<SortOrderType>(SortOrderType.DESC);
  const [pageByTab, setPageByTab] = useState<Record<AdminReportTabValue, number>>({
    open: 0,
    pending: 0,
    inreview: 0,
    escalated: 0,
    closed: 0,
    all: 0,
  });

  const openPage = useMemo(() => buildPage(pageByTab.open, 'open', searchTerm, targetType, targetAction, sortDirection), [pageByTab.open, searchTerm, targetType, targetAction, sortDirection]);
  const pendingPage = useMemo(() => buildPage(pageByTab.pending, 'pending', searchTerm, targetType, targetAction, sortDirection), [pageByTab.pending, searchTerm, targetType, targetAction, sortDirection]);
  const inreviewPage = useMemo(() => buildPage(pageByTab.inreview, 'inreview', searchTerm, targetType, targetAction, sortDirection), [pageByTab.inreview, searchTerm, targetType, targetAction, sortDirection]);
  const escalatedPage = useMemo(() => buildPage(pageByTab.escalated, 'escalated', searchTerm, targetType, targetAction, sortDirection), [pageByTab.escalated, searchTerm, targetType, targetAction, sortDirection]);
  const closedPage = useMemo(() => buildPage(pageByTab.closed, 'closed', searchTerm, targetType, targetAction, sortDirection), [pageByTab.closed, searchTerm, targetType, targetAction, sortDirection]);
  const allPage = useMemo(() => buildPage(pageByTab.all, 'all', searchTerm, targetType, targetAction, sortDirection), [pageByTab.all, searchTerm, targetType, targetAction, sortDirection]);

  const { data: openData, isLoading: openLoading, isError: openError, refetch: refetchOpen } = useGetAdminReports(openPage);
  const { data: pendingData, isLoading: pendingLoading, isError: pendingError, refetch: refetchPending } = useGetAdminReports(pendingPage);
  const { data: inreviewData, isLoading: inreviewLoading, isError: inreviewError, refetch: refetchInreview } = useGetAdminReports(inreviewPage);
  const { data: escalatedData, isLoading: escalatedLoading, isError: escalatedError, refetch: refetchEscalated } = useGetAdminReports(escalatedPage);
  const { data: closedData, isLoading: closedLoading, isError: closedError, refetch: refetchClosed } = useGetAdminReports(closedPage);
  const { data: allData, isLoading: allLoading, isError: allAllError, refetch: refetchAll } = useGetAdminReports(allPage);

  const isAnyLoading = openLoading || pendingLoading || inreviewLoading || escalatedLoading || closedLoading || allLoading;

  const tabCounts = useMemo<Record<AdminReportTabValue, number>>(() => ({
    open: openData?.page?.totalElements ?? 0,
    pending: pendingData?.page?.totalElements ?? 0,
    inreview: inreviewData?.page?.totalElements ?? 0,
    escalated: escalatedData?.page?.totalElements ?? 0,
    closed: closedData?.page?.totalElements ?? 0,
    all: allData?.page?.totalElements ?? 0,
  }), [openData, pendingData, inreviewData, escalatedData, closedData, allData]);

  const activeData = useMemo(() => {
    switch (activeTab) {
      case "open": return { data: openData, loading: openLoading, error: openError };
      case "pending": return { data: pendingData, loading: pendingLoading, error: pendingError };
      case "inreview": return { data: inreviewData, loading: inreviewLoading, error: inreviewError };
      case "escalated": return { data: escalatedData, loading: escalatedLoading, error: escalatedError };
      case "closed": return { data: closedData, loading: closedLoading, error: closedError };
      case "all": return { data: allData, loading: allLoading, error: allAllError };
    }
  }, [activeTab, openData, openLoading, openError, pendingData, pendingLoading, pendingError, inreviewData, inreviewLoading, inreviewError, escalatedData, escalatedLoading, escalatedError, closedData, closedLoading, closedError, allData, allLoading, allAllError]);

  const reports = activeData.data?.data ?? [];
  const totalElements = activeData.data?.page?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));
  const isLoading = activeData.loading;
  const isError = activeData.error;

  const pageNumber = pageByTab[activeTab];

  function handleTabChange(tab: AdminReportTabValue) {
    setActiveTab(tab);
  }

  function resetActiveTabPage() {
    setPageByTab((current) => ({ ...current, [activeTab]: 0 }));
  }

  function setActivePage(updater: (page: number) => number) {
    setPageByTab((current) => ({
      ...current,
      [activeTab]: updater(current[activeTab]),
    }));
  }

  function handleRefresh() {
    refetchOpen();
    refetchPending();
    refetchInreview();
    refetchEscalated();
    refetchClosed();
    refetchAll();
  }

  const hasActiveFilters = searchTerm !== "" || targetType !== ALL_FILTER || targetAction !== ALL_FILTER;

  function handleClearFilters() {
    setSearchTerm("");
    setTargetType(ALL_FILTER);
    setTargetAction(ALL_FILTER);
    resetActiveTabPage();
  }

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-heading">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review user-submitted reports across profiles, posts, questions, comments, and answers.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isAnyLoading}
          aria-label="Refresh reports"
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Status Tabs Cards ── */}
      <ReportsStatusTabs
        activeTab={activeTab}
        tabCounts={tabCounts}
        onTabChange={handleTabChange}
      />

      {/* ── Toolbar / Filters ── */}
      <ReportsToolbar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          resetActiveTabPage();
        }}
        targetType={targetType}
        onTargetTypeChange={(val) => {
          setTargetType(val);
          resetActiveTabPage();
        }}
        targetAction={targetAction}
        onTargetActionChange={(val) => {
          setTargetAction(val);
          resetActiveTabPage();
        }}
        sortDirection={sortDirection}
        onSortChange={(val) => {
          setSortDirection(val);
          resetActiveTabPage();
        }}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* ── Content Table ── */}
      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Could not load reports.</p>
          <button type="button" onClick={handleRefresh} className="btn-ghost">Retry</button>
        </div>
      ) : (
        <>
          <AdminReportsTable
            reports={reports}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <ReportsPagination
            currentPage={pageNumber}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={(page) => setActivePage(() => page)}
          />
        </>
      )}
    </div>
  );
}
