export enum ReportResolution {
  ViolationConfirmed = 0,
  NoViolation = 1,
  Duplicate = 2,
  InsufficientEvidence = 3,
  HandledElsewhere = 4,
  EscalatedToAdmin = 5,
}

export const reportResolutionLabels: Record<ReportResolution, string> = {
  [ReportResolution.ViolationConfirmed]: "Violation confirmed",
  [ReportResolution.NoViolation]: "No violation",
  [ReportResolution.Duplicate]: "Duplicate",
  [ReportResolution.InsufficientEvidence]: "Insufficient evidence",
  [ReportResolution.HandledElsewhere]: "Handled elsewhere",
  [ReportResolution.EscalatedToAdmin]: "Escalated to admin",
};
