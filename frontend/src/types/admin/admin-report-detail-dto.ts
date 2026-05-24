import { ReportResolution } from "../report/report-resolution";
import { ReportTargetAction } from "../report/report-target-action";
import { AdminReportDTO, ProfileSummaryDTO } from "./admin-report-dto";

export interface ReportTargetSnapshotDTO {
  targetTitle?: string | null;
  targetPreview?: string | null;
  targetOwnerDisplayName?: string | null;
  targetOwnerAvatarUrl?: string | null;
  route?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isDeletedAtReportTime: boolean;
}

export interface AdminReportDetailDTO {
  report: AdminReportDTO;
  reportedVersion?: unknown;
  currentTarget?: unknown;
  currentTargetState?: {
    unavailable: boolean;
    deleted: boolean;
    deletedAt?: string | null;
    hidden: boolean;
    moderationStatus?: string | null;
    private: boolean;
    suspended: boolean;
    suspendedUntil?: string | null;
    parentUnavailable: boolean;
    parentDeleted: boolean;
    parentHidden: boolean;
    parentModerationStatus?: string | null;
  } | null;
  reporter?: ProfileSummaryDTO | null;
  targetOwner?: ProfileSummaryDTO | null;
  targetSnapshotJson?: string | null;
  targetSnapshot?: ReportTargetSnapshotDTO | null;
  moderatorNote?: string | null;
  resolution?: ReportResolution | null;
  resolutionNote?: string | null;
  resolvedById?: string | null;
  resolvedBy?: ProfileSummaryDTO | null;
  resolvedAt?: string | null;
  targetAction?: ReportTargetAction | null;
}
