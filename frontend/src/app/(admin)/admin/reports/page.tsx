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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ReportTargetType } from "@/types/report/report-target-type";
import { ReportTargetAction } from "@/types/report/report-target-action";

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

  const pageNumber = pageByTab[activeTab];
  const page = useMemo(
    () => buildPage(pageNumber, activeTab, searchTerm, targetType, targetAction, sortDirection),
    [pageNumber, activeTab, searchTerm, targetType, targetAction, sortDirection],
  );
  const { data, isLoading, isError, refetch } = useGetAdminReports(page);
  const reports = data?.data ?? [];
  const totalElements = data?.page?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));

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

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review user-submitted reports across profiles, posts, questions, comments, and answers.</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[minmax(220px,1fr)_180px_220px_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetActiveTabPage();
            }}
            placeholder="Search report description"
            className="h-10 border-default bg-background pl-9"
          />
        </div>
        <Select
          value={targetType}
          onValueChange={(value) => {
            setTargetType(value);
            resetActiveTabPage();
          }}
        >
          <SelectTrigger className="h-10 border-default bg-background">
            <SelectValue placeholder="Target type" />
          </SelectTrigger>
          <SelectContent className="border-default bg-card">
            <SelectItem value={ALL_FILTER}>All targets</SelectItem>
            <SelectItem value={String(ReportTargetType.Profile)}>Profile</SelectItem>
            <SelectItem value={String(ReportTargetType.Post)}>Post</SelectItem>
            <SelectItem value={String(ReportTargetType.Question)}>Question</SelectItem>
            <SelectItem value={String(ReportTargetType.Comment)}>Comment</SelectItem>
            <SelectItem value={String(ReportTargetType.Answer)}>Answer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={targetAction}
          onValueChange={(value) => {
            setTargetAction(value);
            resetActiveTabPage();
          }}
        >
          <SelectTrigger className="h-10 border-default bg-background">
            <SelectValue placeholder="Enforcement action" />
          </SelectTrigger>
          <SelectContent className="border-default bg-card">
            <SelectItem value={ALL_FILTER}>All actions</SelectItem>
            <SelectItem value={String(ReportTargetAction.None)}>No enforcement</SelectItem>
            <SelectItem value={String(ReportTargetAction.HideContent)}>Hide content</SelectItem>
            <SelectItem value={String(ReportTargetAction.DeleteComment)}>Hide comment</SelectItem>
            <SelectItem value={String(ReportTargetAction.DeleteAnswer)}>Hide answer</SelectItem>
            <SelectItem value={String(ReportTargetAction.SuspendUser)}>Suspend user</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortDirection}
          onValueChange={(value) => {
            setSortDirection(value as SortOrderType);
            resetActiveTabPage();
          }}
        >
          <SelectTrigger className="h-10 border-default bg-background">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="border-default bg-card">
            <SelectItem value={SortOrderType.DESC}>Newest first</SelectItem>
            <SelectItem value={SortOrderType.ASC}>Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Could not load reports.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost">Retry</button>
        </div>
      ) : (
        <>
          <AdminReportsTable
            reports={reports}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {pageNumber + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePage((current) => Math.max(0, current - 1))}
                  disabled={pageNumber <= 0}
                  className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={pageNumber >= totalPages - 1}
                  className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
