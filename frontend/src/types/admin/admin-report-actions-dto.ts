import { ReportResolution } from "@/types/report/report-resolution";

export interface AssignReportDTO {
  note?: string;
}

export interface ResolveReportDTO {
  resolution: ReportResolution;
  moderatorNote?: string;
  resolutionNote?: string;
}

export interface DismissReportDTO {
  resolution: ReportResolution;
  moderatorNote?: string;
}

export interface EscalateReportDTO {
  moderatorNote?: string;
  escalationReason?: string;
}
