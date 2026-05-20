"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { AdminReportProfileHoverCard } from "./admin-report-profile-hover-card";

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

function TargetTypeBadge({ value }: { value: number }) {
  const label = ["Profile", "Post", "Question", "Comment", "Answer"][value] ?? String(value);
  switch (value) {
    case 0: // Profile
      return <span className="badge-purple font-mono text-2xs">{label}</span>;
    case 1: // Post
    case 2: // Question
      return <span className="badge-default font-mono text-2xs">{label}</span>;
    case 3: // Comment
    case 4: // Answer
      return <span className="badge-amber font-mono text-2xs">{label}</span>;
    default:
      return <span className="badge-default font-mono text-2xs">{label}</span>;
  }
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
    if (isAdmin) return false;
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
              <tr className="border-b border-border bg-muted/5">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Assignee</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-subtle transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(report.dateCreated)}</td>
                  <td className="px-4 py-3"><ReportStatusBadge status={report.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <TargetTypeBadge value={report.targetType} />
                      {report.isStaffSensitive && (
                        <span className="badge-red text-2xs mt-1">Staff-owned target</span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="block w-full truncate text-left font-medium text-heading hover:text-primary hover:underline"
                    >
                      {report.targetTitle || report.targetPreview || report.targetId}
                    </button>
                    {report.targetPreview && <p className="mt-1 truncate text-xs text-muted-foreground">{report.targetPreview}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-body">{reportReasonLabels[report.reason]}</td>
                  <td className="max-w-[160px] px-4 py-3 text-xs">
                    <AdminReportProfileHoverCard profile={report.reporter} />
                  </td>
                  <td className="max-w-[160px] px-4 py-3 text-xs">
                    <AdminReportProfileHoverCard profile={report.targetOwner} />
                  </td>
                  <td className="max-w-[160px] px-4 py-3 text-xs">
                    <AdminReportProfileHoverCard profile={report.assignedModerator} fallbackId={report.assignedModeratorId} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="rounded-md border border-default px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-subtle hover:text-heading transition-all select-none">
                            Actions
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-default bg-card">
                          <DropdownMenuItem onClick={() => setSelectedReport(report)} className="cursor-pointer">
                            View details
                          </DropdownMenuItem>
                          
                          {canModify(report) && (
                            <>
                              <DropdownMenuSeparator className="border-default" />
                              <DropdownMenuItem onClick={() => openAction(report, "assign")} className="cursor-pointer">
                                Assign to me
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {canModify(report) && (
                            <>
                              <DropdownMenuSeparator className="border-default" />
                              <DropdownMenuItem onClick={() => openAction(report, "resolve")} className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold">
                                Resolve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction(report, "dismiss")} className="cursor-pointer text-red-600 dark:text-red-400">
                                Dismiss
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {canEscalate(report) && (
                            <>
                              <DropdownMenuSeparator className="border-default" />
                              <DropdownMenuItem onClick={() => openAction(report, "escalate")} className="cursor-pointer text-amber-600 dark:text-amber-400">
                                Escalate
                              </DropdownMenuItem>
                            </>
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
