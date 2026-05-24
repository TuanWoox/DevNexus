import React from "react";
import { ContentType } from "@/types/content-media/content-type";
import { ReportResolutionAction } from "@/types/community-content-report/report-resolution-action";
import { SelectCommunityPostsReportDTO } from "@/types/community-posts-report/select-community-posts-report-dto";
import { SelectCommunityQAPostReportsDTO } from "@/types/community-qa-post-reports/select-community-qa-post-reports-dto";
import { SelectCommunityAnswersReportDTO } from "@/types/community-answers-report/select-community-answers-report-dto";
import { SelectCommunityCommentsReportDTO } from "@/types/community-comments-report/select-community-comments-report-dto";
import { AnyCommunityReportDTO } from "./reports-list-container";
import {
    FileText,
    HelpCircle,
    CheckSquare,
    MessageSquare,
    ShieldAlert,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { ReportStatus } from "@/types/report/report-status";

export interface ReportDetails {
    typeLabel: string;
    contentId: string;
    title: string;
    preview: string;
    link: string;
    authorId?: string;
    dateCreated?: string | null;
}

export function getReportContentDetails(
    report: AnyCommunityReportDTO,
    type: ContentType
): ReportDetails {
    console.log(report);
    switch (type) {
        case ContentType.Post: {
            const r = report as SelectCommunityPostsReportDTO;
            return {
                typeLabel: "Post",
                contentId: r.postId,
                title: r.post?.title || "Untitled Post",
                preview: r.post?.contentPreview || "No preview available",
                link: `/post/${r.postId}`,
                authorId: r.post?.authorId,
                dateCreated: r.post?.dateCreated,
            };
        }
        case ContentType.QA: {
            const r = report as SelectCommunityQAPostReportsDTO;
            return {
                typeLabel: "Q&A Question",
                contentId: r.qaPostId,
                title: r.qaPost?.title || "Untitled Q&A",
                preview: r.qaPost?.contentPreview || "No preview available",
                link: `/questions/${r.qaPostId}`,
                authorId: r.qaPost?.authorId,
                dateCreated: r.qaPost?.dateCreated,
            };
        }
        case ContentType.Answer: {
            const r = report as SelectCommunityAnswersReportDTO;
            return {
                typeLabel: "Answer",
                contentId: r.answerId,
                title: r.answer?.qaPostTitle ? `Answer to: ${r.answer.qaPostTitle}` : "Answer to Q&A",
                preview: r.answer?.contentPreview || "No preview available",
                link: `/questions/${r.answer?.qaPostId || ""}`,
                authorId: r.answer?.authorId,
                dateCreated: r.answer?.dateCreated,
            };
        }
        case ContentType.Comment: {
            const r = report as SelectCommunityCommentsReportDTO;
            let title = "Comment";
            let link = `/communities/${r.communityId}`;
            if (r.comment?.postId) {
                title = `Comment on Post: ${r.comment.postTitle || "Untitled"}`;
                link = `/post/${r.comment.postId}`;
            } else if (r.comment?.qaPostId) {
                title = `Comment on Q&A: ${r.comment.qaPostTitle || "Untitled"}`;
                link = `/questions/${r.comment.qaPostId}`;
            }
            return {
                typeLabel: "Comment",
                contentId: r.commentId,
                title,
                preview: r.comment?.contentPreview || "No preview available",
                link,
                authorId: r.comment?.authorId,
                dateCreated: r.comment?.dateCreated,
            };
        }
        default:
            return {
                typeLabel: "Unknown",
                contentId: "",
                title: "Unknown Content",
                preview: "N/A",
                link: "#",
                authorId: "",
                dateCreated: null,
            };
    }
}

export function getContentTypeLabel(type: ContentType): string {
    switch (type) {
        case ContentType.Post:
            return "Posts";
        case ContentType.QA:
            return "Q&A";
        case ContentType.Answer:
            return "Answers";
        case ContentType.Comment:
            return "Comments";
        default:
            return "Unknown";
    }
}

export function getContentTypeIcon(type: ContentType): React.ReactNode {
    switch (type) {
        case ContentType.Post:
            return <FileText className="h-4 w-4 text-emerald-500" />;
        case ContentType.QA:
            return <HelpCircle className="h-4 w-4 text-amber-500" />;
        case ContentType.Answer:
            return <CheckSquare className="h-4 w-4 text-sky-500" />;
        case ContentType.Comment:
            return <MessageSquare className="h-4 w-4 text-rose-500" />;
        default:
            return <ShieldAlert className="h-4 w-4 text-muted-foreground" />;
    }
}

export function getStatusBadge(status: ReportStatus): React.ReactNode {
    switch (status) {
        case ReportStatus.Pending:
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-none border border-amber-500/20 bg-amber-500/10 text-amber-500 uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    Pending
                </span>
            );
        case ReportStatus.Resolved:
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-none border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolved
                </span>
            );
        case ReportStatus.Rejected:
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-none border border-rose-500/20 bg-rose-500/10 text-rose-500 uppercase tracking-wider">
                    <XCircle className="h-3 w-3" />
                    Rejected
                </span>
            );
        default:
            return null;
    }
}

export function getResolutionActionLabel(action: ReportResolutionAction): string {
    switch (action) {
        case ReportResolutionAction.None:
            return "None";
        case ReportResolutionAction.Reject:
            return "Report Rejected";
        case ReportResolutionAction.RemoveContent:
            return "Content Removed";
        case ReportResolutionAction.RemoveContentAndMute:
            return "Content Removed and User Muted";
        case ReportResolutionAction.RemoveContentAndBan:
            return "Content Removed and User Banned";
        case ReportResolutionAction.PenalizeReporter:
            return "Reporter Penalized";
        default:
            return "Unknown";
    }
}
