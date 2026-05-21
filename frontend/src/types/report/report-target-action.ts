export enum ReportTargetAction {
  None = 0,
  HideContent = 1,
  DeleteComment = 2,
  DeleteAnswer = 3,
  SuspendUser = 4,
}

export const reportTargetActionLabels: Record<ReportTargetAction, string> = {
  [ReportTargetAction.None]: "No enforcement action",
  [ReportTargetAction.HideContent]: "Hide content from public",
  [ReportTargetAction.DeleteComment]: "Delete comment",
  [ReportTargetAction.DeleteAnswer]: "Delete answer",
  [ReportTargetAction.SuspendUser]: "Suspend user",
};
