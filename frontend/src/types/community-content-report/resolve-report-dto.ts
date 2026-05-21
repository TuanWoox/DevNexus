import { ReportResolutionAction } from "./report-resolution-action";

export interface ResolveReportDTO {
    reportId: string;
    action: ReportResolutionAction;
    resolutionNotes?: string;
    mutedUntil?: string;
}
