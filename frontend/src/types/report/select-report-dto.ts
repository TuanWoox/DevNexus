import { ReportReason } from "./report-reason";
import { ReportStatus } from "./report-status";
import { ReportTargetType } from "./report-target-type";

export interface SelectReportDTO {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  status: ReportStatus;
  dateCreated?: string | null;
}
