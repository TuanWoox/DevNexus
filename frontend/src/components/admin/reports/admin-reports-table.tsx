"use client";

import { useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminReportDTO } from "@/types/admin/admin-report-dto";
import { reportReasonLabels } from "@/types/report/report-reason";
import { ReportStatus } from "@/types/report/report-status";
import { ReportStatusBadge } from "./report-status-badge";
import { ReportDetailSheet } from "./report-detail-sheet";

type TabValue = "open" | "pending" | "inreview" | "escalated" | "closed" | "all";

interface AdminReportsTableProps {
  reports: AdminReportDTO[];
  isLoading: boolean;
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function targetTypeLabel(value: number) {
  return ["Profile", "Post", "Question", "Comment", "Answer"][value] ?? String(value);
}

export function AdminReportsTable({ reports, isLoading, activeTab, onTabChange }: AdminReportsTableProps) {
  const [selectedReport, setSelectedReport] = useState<AdminReportDTO | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabValue)}>
        <TabsList>
          {(["open", "pending", "inreview", "escalated", "closed", "all"] as TabValue[]).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab === "inreview" ? "In Review" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {reports.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
          No reports found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Assignee</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-subtle">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(report.dateCreated)}</td>
                  <td className="px-4 py-3"><ReportStatusBadge status={report.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground/85">{targetTypeLabel(report.targetType)}</span>
                      {report.isStaffSensitive && <span className="text-xs text-red-500">Staff sensitive</span>}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="block w-full truncate text-left font-medium text-foreground/85 hover:text-primary hover:underline"
                    >
                      {report.targetTitle || report.targetPreview || report.targetId}
                    </button>
                    {report.targetPreview && <p className="mt-1 truncate text-xs text-muted-foreground">{report.targetPreview}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs">{reportReasonLabels[report.reason]}</td>
                  <td className="px-4 py-3 text-xs">{report.reporter?.displayName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{report.targetOwner?.displayName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{report.assignedModerator?.displayName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-subtle hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4" />
                            View detail
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReportDetailSheet
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </>
  );
}

export type AdminReportTabValue = TabValue;
export const reportTabStatuses: Record<TabValue, ReportStatus[]> = {
  open: [ReportStatus.Pending, ReportStatus.InReview, ReportStatus.Escalated],
  pending: [ReportStatus.Pending],
  inreview: [ReportStatus.InReview],
  escalated: [ReportStatus.Escalated],
  closed: [ReportStatus.Resolved, ReportStatus.Dismissed],
  all: [],
};
