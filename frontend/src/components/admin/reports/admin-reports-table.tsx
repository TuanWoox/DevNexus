"use client";

import { useState } from "react";
import { CheckCircle2, Eye, MoreHorizontal, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminReportDTO } from "@/types/admin/admin-report-dto";
import { RootState } from "@/store/store";
import { reportReasonLabels } from "@/types/report/report-reason";
import { ReportStatus } from "@/types/report/report-status";
import { ReportStatusBadge } from "./report-status-badge";
import { ReportDetailSheet } from "./report-detail-sheet";
import { ReportActionDialog, ReportActionPayload, ReportActionType } from "./report-action-dialog";
import { useAssignReportToMe } from "@/hooks/admin/use-assign-report-to-me";
import { useResolveReport } from "@/hooks/admin/use-resolve-report";
import { useDismissReport } from "@/hooks/admin/use-dismiss-report";
import { useEscalateReport } from "@/hooks/admin/use-escalate-report";
import { ReportResolution } from "@/types/report/report-resolution";

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
  const userRoles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const isAdmin = userRoles.includes("Admin");
  const [selectedReport, setSelectedReport] = useState<AdminReportDTO | null>(null);
  const [actionState, setActionState] = useState<{
    open: boolean;
    action: ReportActionType;
    report: AdminReportDTO | null;
  }>({ open: false, action: "assign", report: null });
  const assignMutation = useAssignReportToMe();
  const resolveMutation = useResolveReport();
  const dismissMutation = useDismissReport();
  const escalateMutation = useEscalateReport();
  const isActionPending = assignMutation.isPending || resolveMutation.isPending || dismissMutation.isPending || escalateMutation.isPending;

  function isClosed(report: AdminReportDTO) {
    return report.status === ReportStatus.Resolved || report.status === ReportStatus.Dismissed;
  }

  function canModify(report: AdminReportDTO) {
    if (isClosed(report)) return false;
    if (report.status === ReportStatus.Escalated && !isAdmin) return false;
    return !report.isStaffSensitive || isAdmin;
  }

  function canEscalate(report: AdminReportDTO) {
    return report.status === ReportStatus.Pending || report.status === ReportStatus.InReview;
  }

  function openAction(report: AdminReportDTO, action: ReportActionType) {
    setActionState({ open: true, action, report });
  }

  function closeAction() {
    if (!isActionPending) {
      setActionState((current) => ({ ...current, open: false }));
    }
  }

  function handleActionConfirm(payload: ReportActionPayload) {
    if (!actionState.report) return;
    const id = actionState.report.id;
    const options = { onSuccess: () => setActionState((current) => ({ ...current, open: false })) };

    if (actionState.action === "assign") {
      assignMutation.mutate({ id, payload: { note: payload.note } }, options);
      return;
    }

    if (actionState.action === "resolve") {
      resolveMutation.mutate({
        id,
        payload: {
          resolution: payload.resolution ?? ReportResolution.ViolationConfirmed,
          moderatorNote: payload.note,
          resolutionNote: payload.resolutionNote,
        },
      }, options);
      return;
    }

    if (actionState.action === "dismiss") {
      dismissMutation.mutate({
        id,
        payload: {
          resolution: payload.resolution ?? ReportResolution.NoViolation,
          moderatorNote: payload.note,
        },
      }, options);
      return;
    }

    escalateMutation.mutate({
      id,
      payload: {
        moderatorNote: payload.note,
        escalationReason: payload.escalationReason,
      },
    }, options);
  }

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
                          {canModify(report) && (
                            <DropdownMenuItem onClick={() => openAction(report, "assign")}>
                              <UserCheck className="h-4 w-4" />
                              Assign to me
                            </DropdownMenuItem>
                          )}
                          {canModify(report) && (
                            <DropdownMenuItem onClick={() => openAction(report, "resolve")}>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              Resolve
                            </DropdownMenuItem>
                          )}
                          {canModify(report) && (
                            <DropdownMenuItem onClick={() => openAction(report, "dismiss")}>
                              <XCircle className="h-4 w-4" />
                              Dismiss
                            </DropdownMenuItem>
                          )}
                          {canEscalate(report) && (
                            <DropdownMenuItem onClick={() => openAction(report, "escalate")}>
                              <ShieldAlert className="h-4 w-4 text-amber-500" />
                              Escalate
                            </DropdownMenuItem>
                          )}
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
        onAction={openAction}
      />
      {actionState.open && (
        <ReportActionDialog
          open={actionState.open}
          action={actionState.action}
          isPending={isActionPending}
          onClose={closeAction}
          onConfirm={handleActionConfirm}
        />
      )}
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
