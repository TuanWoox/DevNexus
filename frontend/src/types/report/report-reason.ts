export enum ReportReason {
  Spam = 0,
  Harassment = 1,
  HateSpeech = 2,
  SexualContent = 3,
  Violence = 4,
  Misinformation = 5,
  Privacy = 6,
  Impersonation = 7,
  IllegalContent = 8,
  Other = 9,
}

export const reportReasonLabels: Record<ReportReason, string> = {
  [ReportReason.Spam]: "Spam",
  [ReportReason.Harassment]: "Harassment",
  [ReportReason.HateSpeech]: "Hate speech",
  [ReportReason.SexualContent]: "Sexual content",
  [ReportReason.Violence]: "Violence",
  [ReportReason.Misinformation]: "Misinformation",
  [ReportReason.Privacy]: "Privacy violation",
  [ReportReason.Impersonation]: "Impersonation",
  [ReportReason.IllegalContent]: "Illegal content",
  [ReportReason.Other]: "Other",
};
