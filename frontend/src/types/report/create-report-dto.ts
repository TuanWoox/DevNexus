import { ReportReason } from "./report-reason";
import { ReportTargetType } from "./report-target-type";

export interface CreateReportDTO {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}
