import { ReportResolution } from "@/types/report/report-resolution";
import { ReportTargetAction } from "@/types/report/report-target-action";

export interface AssignReportDTO {
  note?: string;
}

export interface ResolveReportDTO {
  resolution: ReportResolution;
  moderatorNote?: string;
  resolutionNote?: string;
  targetAction?: ReportTargetAction;
  suspendDays?: number;
  targetActionReason?: string;
}

export interface DismissReportDTO {
  resolution: ReportResolution;
  moderatorNote?: string;
}

export interface EscalateReportDTO {
  moderatorNote?: string;
  escalationReason?: string;
}
