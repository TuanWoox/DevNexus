"use client";

import { useState } from "react";
import {
  AdminReportsTable,
  AdminReportTabValue,
  reportTabStatuses,
} from "@/components/admin/reports/admin-reports-table";
import { useGetAdminReports } from "@/hooks/admin/use-get-admin-reports";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { FilterMapping, Page } from "@/types/common/page";

const DEFAULT_PAGE_SIZE = 20;

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

function buildPage(pageNumber: number, tab: AdminReportTabValue): Page<string> {
  return {
    pageNumber,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    orders: [],
    filter: buildStatusFilter(tab),
    selected: [],
  };
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<AdminReportTabValue>("open");
  const [pageByTab, setPageByTab] = useState<Record<AdminReportTabValue, number>>({
    open: 0,
    pending: 0,
    inreview: 0,
    escalated: 0,
    closed: 0,
    all: 0,
  });

  const pageNumber = pageByTab[activeTab];
  const page = buildPage(pageNumber, activeTab);
  const { data, isLoading, isError, refetch } = useGetAdminReports(page);
  const reports = data?.data ?? [];
  const totalElements = data?.page?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));

  function handleTabChange(tab: AdminReportTabValue) {
    setActiveTab(tab);
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
