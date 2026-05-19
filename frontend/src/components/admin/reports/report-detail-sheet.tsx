"use client";

import { Calendar, FileText, ShieldAlert, User } from "lucide-react";
import { useSelector } from "react-redux";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminReportDetail } from "@/hooks/admin/use-get-admin-report-detail";
import { AdminReportDTO } from "@/types/admin/admin-report-dto";
import { RootState } from "@/store/store";
import { reportReasonLabels } from "@/types/report/report-reason";
import { ReportStatus } from "@/types/report/report-status";
import { ReportStatusBadge } from "./report-status-badge";
import { ReportActionType } from "./report-action-dialog";

interface ReportDetailSheetProps {
  open: boolean;
  onClose: () => void;
  report: AdminReportDTO | null;
  onAction?: (report: AdminReportDTO, action: ReportActionType) => void;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function JsonBlock({ value }: { value: unknown }) {
  if (value == null) {
    return <p className="text-sm text-muted-foreground">Unavailable</p>;
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground/85">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 min-w-0 truncate text-sm text-foreground/85">{value || "—"}</div>
    </div>
  );
}

function isClosed(report: AdminReportDTO) {
  return report.status === ReportStatus.Resolved || report.status === ReportStatus.Dismissed;
}

export function ReportDetailSheet({ open, onClose, report, onAction }: ReportDetailSheetProps) {
  const userRoles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const isAdmin = userRoles.includes("Admin");
  const { data, isLoading } = useGetAdminReportDetail(report?.id, open);
  const activeReport = data?.report ?? report;
  const canEscalate = !!activeReport && (activeReport.status === ReportStatus.Pending || activeReport.status === ReportStatus.InReview);
  const canAct = !!activeReport &&
    !isClosed(activeReport) &&
    (activeReport.status !== ReportStatus.Escalated || isAdmin) &&
    (!activeReport.isStaffSensitive || isAdmin);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="!w-[min(92vw,980px)] !max-w-none overflow-y-auto p-0 sm:!max-w-none">
        <SheetHeader className="border-b border-border bg-card px-6 py-5">
          <div className="space-y-3 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              {activeReport && <ReportStatusBadge status={activeReport.status} />}
              <span className="badge-default">{activeReport?.targetType}</span>
              {activeReport?.isStaffSensitive && <span className="badge-danger">Staff sensitive</span>}
            </div>
            <SheetTitle className="text-2xl font-bold text-heading">
              {activeReport?.targetTitle || "Report detail"}
            </SheetTitle>
            <SheetDescription>
              {activeReport?.targetPreview || activeReport?.descriptionPreview || "Review reported target and current state."}
            </SheetDescription>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            <section className="grid gap-3 md:grid-cols-3">
              <InfoRow label="Reason" value={activeReport ? reportReasonLabels[activeReport.reason] : undefined} />
              <InfoRow label="Created" value={formatDate(activeReport?.dateCreated)} />
              <InfoRow label="Assignee" value={activeReport?.assignedModerator?.displayName ?? activeReport?.assignedModeratorId} />
              <InfoRow label="Reporter" value={data?.reporter?.displayName ?? activeReport?.reporter?.displayName} />
              <InfoRow label="Target owner" value={data?.targetOwner?.displayName ?? activeReport?.targetOwner?.displayName} />
              <InfoRow label="Resolved" value={formatDate(data?.resolvedAt)} />
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-heading">Report Metadata</h3>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <InfoRow label="Report ID" value={activeReport?.id} />
                <InfoRow label="Target ID" value={activeReport?.targetId} />
                <InfoRow label="Target history ID" value={activeReport?.targetHistoryId} />
                <InfoRow label="Route" value={activeReport?.targetRoute} />
              </div>
              {(activeReport?.descriptionPreview || data?.moderatorNote || data?.resolutionNote) && (
                <div className="space-y-2 border-t border-border p-4 text-sm text-foreground/85">
                  {activeReport?.descriptionPreview && <p>{activeReport.descriptionPreview}</p>}
                  {data?.moderatorNote && <p>Moderator note: {data.moderatorNote}</p>}
                  {data?.resolutionNote && <p>Resolution note: {data.resolutionNote}</p>}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-heading">Reported Version</h3>
              </div>
              <div className="p-4">
                <JsonBlock value={data?.reportedVersion} />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-heading">Current Target</h3>
              </div>
              <div className="p-4">
                <JsonBlock value={data?.currentTarget} />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-heading">Lightweight Snapshot</h3>
              </div>
              <div className="p-4">
                <JsonBlock value={data?.targetSnapshot} />
              </div>
            </section>
          </div>
        )}
        <SheetFooter className="border-t border-border bg-background/95 px-6 py-4">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {activeReport && canAct && (
              <Button type="button" variant="secondary" onClick={() => onAction?.(activeReport, "assign")}>
                Assign to me
              </Button>
            )}
            {activeReport && canAct && (
              <Button type="button" onClick={() => onAction?.(activeReport, "resolve")}>
                Resolve
              </Button>
            )}
            {activeReport && canAct && (
              <Button type="button" variant="destructive" onClick={() => onAction?.(activeReport, "dismiss")}>
                Dismiss
              </Button>
            )}
            {activeReport && canEscalate && (
              <Button type="button" variant="outline" onClick={() => onAction?.(activeReport, "escalate")}>
                Escalate
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
