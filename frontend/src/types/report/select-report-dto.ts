import { ReportReason } from "./report-reason";
import { ReportStatus } from "./report-status";
import { ReportTargetType } from "./report-target-type";

export interface SelectReportDTO {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId: string;
  targetHistoryId?: string | null;
  targetSnapshotJson?: string | null;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  dateCreated?: string | null;
  dateModified?: string | null;
}
