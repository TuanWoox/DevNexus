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
  reporter?: ProfileSummaryDTO | null;
  targetOwner?: ProfileSummaryDTO | null;
  targetSnapshotJson?: string | null;
  targetSnapshot?: ReportTargetSnapshotDTO | null;
  moderatorNote?: string | null;
  resolution?: number | null;
  resolutionNote?: string | null;
  resolvedById?: string | null;
  resolvedBy?: ProfileSummaryDTO | null;
  resolvedAt?: string | null;
}
