"use client";

import type { ReactNode } from "react";
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
import { reportResolutionLabels } from "@/types/report/report-resolution";
import { AdminReportProfileHoverCard } from "./admin-report-profile-hover-card";

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

function InfoRow({ label, value, isMono = false }: { label: string; value?: ReactNode; isMono?: boolean }) {
  return (
    <div className="rounded-lg border border-default bg-background px-3 py-2">
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 min-w-0 truncate text-sm text-body ${isMono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function isClosed(report: AdminReportDTO) {
  return report.status === ReportStatus.Resolved || report.status === ReportStatus.Dismissed;
}

function ReportedContentView({
  targetType,
  data,
  snapshot,
}: {
  targetType: number;
  data: any;
  snapshot?: any;
}) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        Content details unavailable (it may have been deleted or is currently inaccessible)
      </div>
    );
  }

  // Unpack history wrapper if present
  let content = data;
  if (data && typeof data === "object" && "content" in data) {
    content = data.content;
  }

  switch (targetType) {
    case 0: { // Profile
      const displayName = content.fullName || content.displayName || snapshot?.targetOwnerDisplayName || "Unknown User";
      const bio = content.bio || snapshot?.targetPreview || "No bio available";
      const avatarUrl = content.avatarUrl || snapshot?.targetOwnerAvatarUrl;
      const isSuspended = !!content.isSuspended || !!content.deleted;
      const isPrivate = !!content.isPrivate;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-12 w-12 rounded-full object-cover border border-default" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-base font-bold text-heading">{displayName}</div>
              <div className="font-mono text-2xs text-muted-foreground">
                Profile ID: {content.id || data.id || "—"}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed">
            {bio}
          </div>
          <div className="flex flex-wrap gap-2">
            {isSuspended && <span className="badge-red font-mono">Suspended</span>}
            {isPrivate && <span className="badge-amber font-mono">Private Profile</span>}
            {content.reputationPoints != null && (
              <span className="badge-default font-mono">Reputation: {content.reputationPoints}</span>
            )}
            {content.role && <span className="badge-purple font-mono">{content.role}</span>}
          </div>
          {content.techStacks && content.techStacks.length > 0 && (
            <div className="space-y-1">
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tech Stacks</div>
              <div className="flex flex-wrap gap-1.5">
                {content.techStacks.map((tech: string) => (
                  <span key={tech} className="badge-default font-mono text-2xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          {snapshot?.route && (
            <a
              href={snapshot.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-2xs text-primary hover:underline"
            >
              View profile page &rarr;
            </a>
          )}
        </div>
      );
    }
    case 1: // Post
    case 2: { // Question
      const title = content.title || snapshot?.targetTitle || "Untitled";
      const body = content.content || snapshot?.targetPreview || "No content";
      const authorName = content.author?.fullName || content.author?.displayName || snapshot?.targetOwnerDisplayName || "Unknown Author";
      const authorAvatar = content.author?.avatarUrl;
      const tags = content.tagNames || [];
      const isQuestion = targetType === 2;

      return (
        <div className="space-y-3">
          <div className="text-lg font-bold text-heading leading-tight">{title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-mono">@{authorName}</span>
            <span>&bull;</span>
            <span className="font-mono">Created: {formatDate(content.dateCreated || data.dateCreated)}</span>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
            {body}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag: string) => (
                  <span key={tag} className="badge-default font-mono text-2xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {content.moderationStatus != null && (
              <span className="badge-default font-mono text-2xs">
                Moderation: {["Pending", "Approved", "Rejected"][content.moderationStatus] ?? String(content.moderationStatus)}
              </span>
            )}
          </div>
          {snapshot?.route && (
            <a
              href={snapshot.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-2xs text-primary hover:underline"
            >
              View {isQuestion ? "question" : "post"} page &rarr;
            </a>
          )}
        </div>
      );
    }
    case 3: // Comment
    case 4: { // Answer
      const body = content.content || snapshot?.targetPreview || "No content";
      const authorName = content.author?.fullName || content.author?.displayName || snapshot?.targetOwnerDisplayName || "Unknown Author";
      const isAnswer = targetType === 4;

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">@{authorName}</span>
            <span>&bull;</span>
            <span className="font-mono">Created: {formatDate(content.dateCreated || data.dateCreated)}</span>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
          {snapshot?.route && (
            <a
              href={snapshot.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-2xs text-primary hover:underline"
            >
              View parent {isAnswer ? "question" : "post"} page &rarr;
            </a>
          )}
        </div>
      );
    }
    default:
      return (
        <pre className="max-h-60 overflow-auto rounded-lg border border-default bg-muted/30 p-3 font-mono text-xs leading-relaxed text-body">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}

function ChangeIndicator({
  currentTarget,
  targetSnapshot,
}: {
  currentTarget: any;
  targetSnapshot?: any;
}) {
  if (currentTarget == null && targetSnapshot?.isDeletedAtReportTime) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
        <span className="font-bold">DELETED:</span> Target content was already deleted at the time of reporting.
      </div>
    );
  }

  if (currentTarget == null) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
        <span className="font-bold">NOT FOUND:</span> Target no longer exists in the system database.
      </div>
    );
  }

  const currentModified = currentTarget.dateModified || currentTarget.dateCreated;
  const snapshotUpdated = targetSnapshot?.updatedAt || targetSnapshot?.createdAt;

  if (currentModified && snapshotUpdated && new Date(currentModified) > new Date(snapshotUpdated)) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 animate-fade-in-up">
        <span className="font-bold">CONTENT CHANGED:</span> Target was modified by the author after the report was submitted. Review both historical and current states below.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
      <span className="font-bold">NO CHANGES:</span> Current target content is unmodified since the report timestamp.
    </div>
  );
}

export function ReportDetailSheet({ open, onClose, report, onAction }: ReportDetailSheetProps) {
  const userRoles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const isAdmin = userRoles.includes("Admin");
  const { data, isLoading } = useGetAdminReportDetail(report?.id, open);
  const activeReport = data?.report ?? report;
  const canEscalate = !!activeReport && !isAdmin && (activeReport.status === ReportStatus.Pending || activeReport.status === ReportStatus.InReview);
  const canAct = !!activeReport &&
    !isClosed(activeReport) &&
    (activeReport.status !== ReportStatus.Escalated || isAdmin) &&
    (!activeReport.isStaffSensitive || isAdmin);

  const targetTypeName = activeReport?.targetType != null 
    ? ["Profile", "Post", "Question", "Comment", "Answer"][activeReport.targetType] ?? String(activeReport.targetType)
    : "";

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="!w-[min(92vw,980px)] !max-w-none overflow-y-auto p-0 bg-page sm:!max-w-none">
        <SheetHeader className="border-b border-default bg-card px-6 py-5">
          <div className="space-y-3 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              {activeReport && <ReportStatusBadge status={activeReport.status} />}
              <span className="badge-default font-mono">{targetTypeName}</span>
              {activeReport?.isStaffSensitive && <span className="badge-red">Staff-owned target</span>}
            </div>
            <SheetTitle className="text-2xl font-bold text-heading">
              {activeReport?.targetTitle || "Report detail"}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm leading-relaxed">
              {activeReport?.targetPreview || activeReport?.descriptionPreview || "Review reported content and active resolutions."}
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
            {/* SECTION 1 — REPORT SUMMARY */}
            <section className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <InfoRow label="Reason" value={activeReport ? reportReasonLabels[activeReport.reason] : undefined} />
                <InfoRow label="Created" value={formatDate(activeReport?.dateCreated)} isMono />
                <InfoRow
                  label="Assignee"
                  value={<AdminReportProfileHoverCard profile={activeReport?.assignedModerator} fallbackId={activeReport?.assignedModeratorId} />}
                  isMono
                />
                <InfoRow
                  label="Reporter"
                  value={<AdminReportProfileHoverCard profile={data?.reporter ?? activeReport?.reporter} />}
                  isMono
                />
                <InfoRow
                  label="Target Owner"
                  value={<AdminReportProfileHoverCard profile={data?.targetOwner ?? activeReport?.targetOwner} />}
                  isMono
                />
                <InfoRow label="Status" value={activeReport ? ["Pending", "In Review", "Resolved", "Dismissed", "Escalated"][activeReport.status] ?? String(activeReport.status) : undefined} />
              </div>

              {activeReport?.descriptionPreview && (
                <div className="rounded-lg border border-default bg-card p-4 space-y-1">
                  <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Reporter description</div>
                  <div className="text-sm text-body leading-relaxed whitespace-pre-wrap">{activeReport.descriptionPreview}</div>
                </div>
              )}
            </section>

            {/* SECTION 2 — REPORTED CONTENT (AT TIME OF REPORT) */}
            <section className="rounded-xl border border-default bg-card overflow-hidden">
              <div className="border-b border-default bg-muted/20 px-4 py-3">
                <h3 className="text-sm font-semibold text-heading">Reported Version (Content at time of report)</h3>
              </div>
              <div className="p-4">
                <ReportedContentView 
                  targetType={activeReport?.targetType ?? 1} 
                  data={data?.reportedVersion} 
                  snapshot={data?.targetSnapshot} 
                />
              </div>
            </section>

            {/* SECTION 3 — CURRENT STATE & CHANGE INDICATOR */}
            <section className="space-y-3">
              <ChangeIndicator 
                currentTarget={data?.currentTarget} 
                targetSnapshot={data?.targetSnapshot} 
              />
              <div className="rounded-xl border border-default bg-card overflow-hidden">
                <div className="border-b border-default bg-muted/20 px-4 py-3">
                  <h3 className="text-sm font-semibold text-heading">Current State</h3>
                </div>
                <div className="p-4">
                  <ReportedContentView 
                    targetType={activeReport?.targetType ?? 1} 
                    data={data?.currentTarget} 
                    snapshot={data?.targetSnapshot} 
                  />
                </div>
              </div>
            </section>

            {/* SECTION 4 — MODERATOR NOTES & RESOLUTION DETAILS */}
            {(data?.moderatorNote || data?.resolutionNote || data?.resolvedBy) && (
              <section className="rounded-xl border border-default bg-card overflow-hidden">
                <div className="border-b border-default bg-muted/20 px-4 py-3">
                  <h3 className="text-sm font-semibold text-heading">Moderation Details</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoRow
                      label="Resolved By"
                      value={<AdminReportProfileHoverCard profile={data?.resolvedBy} fallbackId={data?.resolvedById} />}
                      isMono
                    />
                    <InfoRow label="Resolved At" value={formatDate(data?.resolvedAt)} isMono />
                  </div>
                  {data?.resolution != null && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution Verdict</div>
                      <div className="text-sm font-semibold text-body">
                        {reportResolutionLabels[data.resolution] ?? String(data.resolution)}
                      </div>
                    </div>
                  )}
                  {data?.moderatorNote && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Moderator internal note</div>
                      <div className="rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed">{data.moderatorNote}</div>
                    </div>
                  )}
                  {data?.resolutionNote && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution public note</div>
                      <div className="rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed">{data.resolutionNote}</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SECTION 5 — ADVANCED / RAW DEBUG DATA (COLLAPSED) */}
            <section className="rounded-xl border border-default bg-card overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors select-none">
                  <span className="text-sm font-semibold text-heading">Technical ID & Raw Metadata</span>
                  <span className="text-xs text-muted-foreground group-open:hidden">Expand &darr;</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">Collapse &uarr;</span>
                </summary>
                <div className="p-4 border-t border-default space-y-4 bg-muted/5 animate-fade-in-up">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoRow label="Report ID" value={activeReport?.id} isMono />
                    <InfoRow label="Target ID" value={activeReport?.targetId} isMono />
                    <InfoRow label="Target history ID" value={activeReport?.targetHistoryId} isMono />
                    <InfoRow label="Snapshot route" value={activeReport?.targetRoute} isMono />
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Raw snapshot payload</div>
                    <pre className="max-h-60 overflow-auto rounded-lg border border-default bg-muted/40 p-3 font-mono text-2xs leading-relaxed text-body">
                      {JSON.stringify(data?.targetSnapshot, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Raw reportedVersion payload</div>
                    <pre className="max-h-60 overflow-auto rounded-lg border border-default bg-muted/40 p-3 font-mono text-2xs leading-relaxed text-body">
                      {JSON.stringify(data?.reportedVersion, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Raw currentTarget payload</div>
                    <pre className="max-h-60 overflow-auto rounded-lg border border-default bg-muted/40 p-3 font-mono text-2xs leading-relaxed text-body">
                      {JSON.stringify(data?.currentTarget, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </section>
          </div>
        )}
        <SheetFooter className="border-t border-default bg-background/95 px-6 py-4">
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
