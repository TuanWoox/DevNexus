import { ReportReason } from "@/types/report/report-reason";
import { ReportResolution } from "@/types/report/report-resolution";
import { ReportStatus } from "@/types/report/report-status";
import { ReportTargetType } from "@/types/report/report-target-type";

export interface ProfileSummaryDTO {
  id: string;
  applicationUserId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role?: string | null;
  isSuspended: boolean;
  deleted: boolean;
}

export interface AdminReportDTO {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetHistoryId?: string | null;
  reason: ReportReason;
  descriptionPreview?: string | null;
  status: ReportStatus;
  reporter?: ProfileSummaryDTO | null;
  targetOwner?: ProfileSummaryDTO | null;
  targetTitle?: string | null;
  targetPreview?: string | null;
  targetRoute?: string | null;
  assignedModeratorId?: string | null;
  assignedModerator?: ProfileSummaryDTO | null;
  resolution?: ReportResolution | null;
  resolvedAt?: string | null;
  dateCreated?: string | null;
  isStaffSensitive: boolean;
}
