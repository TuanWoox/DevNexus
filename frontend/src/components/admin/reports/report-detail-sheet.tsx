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
import { ReportTargetAction, reportTargetActionLabels } from "@/types/report/report-target-action";
import { AdminReportProfileHoverCard } from "./admin-report-profile-hover-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MarkdownViewer } from "@/components/editor/markdown-viewer";

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

function textValue(value: unknown, fallback?: string): string {
  return typeof value === "string" && value.trim() ? value : fallback ?? "";
}

const moderationStatusLabels: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Flagged",
  3: "In Review",
};

function formatModerationStatus(status: unknown, fallback = "moderated"): string {
  if (typeof status === "number") {
    return moderationStatusLabels[status] ?? String(status);
  }

  if (typeof status === "string") {
    const numericStatus = Number(status);
    if (Number.isInteger(numericStatus) && status.trim() !== "") {
      return moderationStatusLabels[numericStatus] ?? status;
    }
    return status === "InReview" ? "In Review" : status;
  }

  return status == null ? fallback : String(status);
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

function ContentBlock({ content }: { content: string }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed [overflow-wrap:anywhere]">
      <MarkdownViewer source={content} />
    </div>
  );
}

function StateBadges({ state }: { state?: any }) {
  if (!state) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {state.deleted && <span className="badge-red font-mono text-2xs">Deleted</span>}
      {state.hidden && <span className="badge-amber font-mono text-2xs">Hidden: {formatModerationStatus(state.moderationStatus)}</span>}
      {state.private && <span className="badge-purple font-mono text-2xs">Private</span>}
      {state.suspended && <span className="badge-red font-mono text-2xs">Suspended</span>}
      {state.parentUnavailable && (
        <span className="badge-amber font-mono text-2xs">
          Parent unavailable{state.parentModerationStatus ? `: ${formatModerationStatus(state.parentModerationStatus)}` : ""}
        </span>
      )}
      {state.unavailable && <span className="badge-red font-mono text-2xs">Unavailable</span>}
    </div>
  );
}

function ReportedContentView({
  targetType,
  data,
  snapshot,
  state,
}: {
  targetType: number;
  data: any;
  snapshot?: any;
  state?: any;
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
            <UserAvatar avatarUrl={avatarUrl} fullName={displayName} className="h-12 w-12 border border-default" />
            <div>
              <div className="text-base font-bold text-heading">{displayName}</div>
              <div className="font-mono text-2xs text-muted-foreground">
                Profile ID: {content.id || data.id || "—"}
              </div>
            </div>
          </div>
          <ContentBlock content={bio} />
          <StateBadges state={state} />
          <div className="flex flex-wrap gap-2">
            {isSuspended && <span className="badge-red font-mono">Suspended</span>}
            {isPrivate && <span className="badge-amber font-mono">Private Profile</span>}
            {/*
              Reputation points are hidden until scoring rules are implemented.
              {content.reputationPoints != null && (
                <span className="badge-default font-mono">Reputation: {content.reputationPoints}</span>
              )}
            */}
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
      const title = textValue(content.title, textValue(snapshot?.targetTitle, "Untitled"));
      const body = textValue(content.content, textValue(snapshot?.targetPreview, "No content"));
      const authorName = textValue(content.author?.fullName, textValue(content.author?.displayName, textValue(snapshot?.targetOwnerDisplayName, "Unknown Author")));
      const authorAvatar = textValue(content.author?.avatarUrl);
      const tags = content.tagNames || [];
      const isQuestion = targetType === 2;
      const createdAt = textValue(content.dateCreated, textValue(data.dateCreated));

      return (
        <div className="space-y-3">
          <div className="text-lg font-bold text-heading leading-tight">{title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserAvatar avatarUrl={authorAvatar || undefined} fullName={authorName} className="h-5 w-5" />
            <span className="font-mono">@{authorName}</span>
            <span>&bull;</span>
            <span className="font-mono">Created: {formatDate(createdAt)}</span>
          </div>
          <ContentBlock content={body} />
          <StateBadges state={state} />
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
                Moderation: {formatModerationStatus(content.moderationStatus)}
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
      const body = textValue(content.content, textValue(snapshot?.targetPreview, "No content"));
      const authorName = textValue(content.author?.fullName, textValue(content.author?.displayName, textValue(snapshot?.targetOwnerDisplayName, "Unknown Author")));
      const isAnswer = targetType === 4;
      const createdAt = textValue(content.dateCreated, textValue(data.dateCreated));

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">@{authorName}</span>
            <span>&bull;</span>
            <span className="font-mono">Created: {formatDate(createdAt)}</span>
          </div>
          <ContentBlock content={body} />
          <StateBadges state={state} />
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

function normalizeText(val: unknown): string {
  if (val == null) return "";
  return String(val).trim().replace(/\r\n/g, "\n");
}

function sameStringArray(a: unknown, b: unknown): boolean {
  const arrA = Array.isArray(a) ? a.map(String).map(s => s.trim()).filter(Boolean) : [];
  const arrB = Array.isArray(b) ? b.map(String).map(s => s.trim()).filter(Boolean) : [];
  if (arrA.length !== arrB.length) return false;
  
  const sortedA = [...arrA].sort();
  const sortedB = [...arrB].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function hasAuthorContentChanged(
  currentTarget: any,
  reportedVersion: any,
  targetSnapshot: any,
  targetType: number
): boolean {
  if (!currentTarget) return false;

  // Unpack history wrapper if present
  let currentContent = currentTarget;
  if (currentTarget && typeof currentTarget === "object" && "content" in currentTarget) {
    currentContent = currentTarget.content;
  }

  let reportedContent = reportedVersion;
  if (reportedVersion && typeof reportedVersion === "object" && "content" in reportedVersion) {
    reportedContent = reportedVersion.content;
  }

  const currentTitle = normalizeText(currentContent.title || currentContent.fullName || currentContent.displayName);
  const currentBody = normalizeText(currentContent.content || currentContent.bio);
  
  const reportedTitle = normalizeText(
    reportedContent?.title || 
    reportedContent?.fullName || 
    reportedContent?.displayName || 
    targetSnapshot?.targetTitle || 
    targetSnapshot?.targetOwnerDisplayName
  );
  
  const reportedBody = normalizeText(
    reportedContent?.content || 
    reportedContent?.bio || 
    targetSnapshot?.targetPreview
  );

  // 1. Check title/display name
  if (targetType === 0 || targetType === 1 || targetType === 2) {
    if (currentTitle !== reportedTitle) {
      return true;
    }
  }

  // 2. Check main body content
  if (currentBody !== reportedBody) {
    const isTruncated = reportedBody.endsWith("...");
    if (isTruncated) {
      const prefix = reportedBody.slice(0, -3).trim();
      if (prefix && !currentBody.startsWith(prefix)) {
        return true;
      }
    } else {
      return true;
    }
  }

  // 3. Check tags for posts/questions
  if (targetType === 1 || targetType === 2) {
    const currentTags = currentContent.tagNames || [];
    const reportedTags = reportedContent?.tagNames || [];
    if (!sameStringArray(currentTags, reportedTags)) {
      return true;
    }
  }

  return false;
}

function ChangeIndicator({
  currentTarget,
  reportedVersion,
  targetSnapshot,
  currentTargetState,
  targetType,
}: {
  currentTarget: any;
  reportedVersion?: any;
  targetSnapshot?: any;
  currentTargetState?: any;
  targetType: number;
}) {
  if (currentTargetState?.deleted) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
        <span className="font-bold">DELETED:</span> Target content is currently soft-deleted.
      </div>
    );
  }

  if (currentTargetState?.hidden) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
        <span className="font-bold">HIDDEN:</span> Target content is currently {formatModerationStatus(currentTargetState.moderationStatus, "not publicly visible")}.
      </div>
    );
  }

  if (currentTargetState?.unavailable || (currentTarget == null && targetSnapshot?.isDeletedAtReportTime)) {
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

  const contentChanged = hasAuthorContentChanged(currentTarget, reportedVersion, targetSnapshot, targetType);

  if (contentChanged) {
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
      <SheetContent side="right" className="flex !w-[min(92vw,980px)] !max-w-none flex-col overflow-hidden p-0 bg-page sm:!max-w-none">
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
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
                reportedVersion={data?.reportedVersion}
                targetSnapshot={data?.targetSnapshot} 
                currentTargetState={data?.currentTargetState}
                targetType={activeReport?.targetType ?? 1}
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
                    state={data?.currentTargetState}
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
                      <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed [overflow-wrap:anywhere]">{data.moderatorNote}</div>
                    </div>
                  )}
                  {data?.resolutionNote && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution public note</div>
                      <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/30 p-3 text-sm text-body leading-relaxed [overflow-wrap:anywhere]">{data.resolutionNote}</div>
                    </div>
                  )}
                  {data?.targetAction != null && data.targetAction !== ReportTargetAction.None && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Enforcement action</div>
                      <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm font-semibold text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                        {reportTargetActionLabels[data.targetAction as ReportTargetAction] ?? String(data.targetAction)}
                      </div>
                    </div>
                  )}
                  {data?.targetAction === ReportTargetAction.None && data?.resolution != null && (
                    <div className="space-y-1">
                      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Enforcement action</div>
                      <div className="rounded-lg border border-default bg-muted/30 p-3 text-sm text-muted-foreground">
                        No enforcement action taken
                      </div>
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
        </div>
        <SheetFooter className="shrink-0 border-t border-default bg-background/95 px-6 py-4 backdrop-blur">
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
