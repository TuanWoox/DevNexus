import { ReportStatus } from "@/types/report/report-status";

const labels: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "Pending",
  [ReportStatus.InReview]: "In Review",
  [ReportStatus.Resolved]: "Resolved",
  [ReportStatus.Dismissed]: "Dismissed",
  [ReportStatus.Escalated]: "Escalated",
  [ReportStatus.Rejected]: "Rejected",
};

const classes: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  [ReportStatus.InReview]: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  [ReportStatus.Resolved]: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  [ReportStatus.Dismissed]: "bg-muted text-muted-foreground ring-border",
  [ReportStatus.Escalated]: "bg-red-500/10 text-red-600 ring-red-500/20",
  [ReportStatus.Rejected]: "bg-red-500/10 text-red-600 ring-red-500/20",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${classes[status]}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function getReportStatusLabel(status: ReportStatus) {
  return labels[status] ?? String(status);
}
