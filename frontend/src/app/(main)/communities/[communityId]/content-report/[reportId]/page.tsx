"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetReportById } from "@/hooks/community-content-report-hooks/use-get-report-by-id";
import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { ContentType } from "@/types/content-media/content-type";
import { ReportStatus } from "@/types/report/report-status";
import { SelectCommunityPostsReportDTO } from "@/types/community-posts-report/select-community-posts-report-dto";
import { SelectCommunityQAPostReportsDTO } from "@/types/community-qa-post-reports/select-community-qa-post-reports-dto";
import { SelectCommunityAnswersReportDTO } from "@/types/community-answers-report/select-community-answers-report-dto";
import { SelectCommunityCommentsReportDTO } from "@/types/community-comments-report/select-community-comments-report-dto";

// Co-located modular components
import { ReportDetailHeader } from "./_components/report-detail-header";
import { ReportStatusCard } from "./_components/report-status-card";
import { ReportResolutionCard } from "./_components/report-resolution-card";
import { ReportedContentCard } from "./_components/reported-content-card";
import { ReportReasonCard } from "./_components/report-reason-card";
import { ReportActions } from "./_components/report-actions";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Terminal, AlertOctagon } from "lucide-react";

type ConcreteReportDTO =
    | SelectCommunityPostsReportDTO
    | SelectCommunityQAPostReportsDTO
    | SelectCommunityAnswersReportDTO
    | SelectCommunityCommentsReportDTO;

export default function ReportDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const communityId = params.communityId as string;
    const reportId = params.reportId as string;
    const contentType = Number(searchParams.get("type") ?? "0") as ContentType;

    // Fetch report by ID with the union type of all concrete reports
    const { data: report, isLoading, error } = useGetReportById<ConcreteReportDTO>(
        communityId,
        contentType,
        reportId
    );

    // Fetch community to check current user roles
    const { data: community, isLoading: isCommunityLoading } = useGetCommunityById(communityId);

    const currentUserRole = community?.currentUserRole;
    const isStaff = currentUserRole === "MODERATOR" || currentUserRole === "OWNER";

    // Dynamic label for the report content type
    const getContentTypeLabel = () => {
        switch (contentType) {
            case ContentType.Post:
                return "Post";
            case ContentType.QA:
                return "Q&A Question";
            case ContentType.Answer:
                return "Q&A Answer";
            case ContentType.Comment:
                return "Comment";
            default:
                return "Content";
        }
    };

    // Shimmering skeleton loader mimicking unified case file topology
    if (isLoading || isCommunityLoading) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-4 h-[calc(100dvh-2rem)] flex flex-col justify-center animate-pulse">
                <div className="bg-card border-2 border-border/80 rounded-2xl shadow-md p-6 sm:p-8 space-y-8 overflow-hidden max-h-[calc(100dvh-4rem)]">
                    {/* Header Skeleton */}
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-3 flex-1">
                            <Skeleton className="h-3 w-32" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-3.5 w-32" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm md:self-end">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Status Card Skeleton */}
                    <div className="bg-muted/30 border border-border p-5 rounded-xl flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2 mt-1">
                            <Skeleton className="h-4.5 w-32" />
                            <Skeleton className="h-3.5 w-full" />
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Reason Card Skeleton */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-6 w-36 rounded-md" />
                        </div>
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>

                    <div className="h-px bg-border" />

                    {/* Reported Content Skeleton */}
                    <div className="space-y-5">
                        <div className="flex justify-between items-center pb-2">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-28 rounded-md" />
                        </div>
                        <Skeleton className="h-36 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // High-contrast, premium 403 Forbidden / Access Denied page
    if (error || !report) {
        const errorMessage = error instanceof Error ? error.message : "Access Denied";
        const isPermissionError = errorMessage.toLowerCase().includes("permission") || errorMessage.toLowerCase().includes("unauthorized");

        return (
            <div className="container max-w-xl mx-auto px-4 py-16">
                <div className="bg-card border border-border p-8 rounded-xl shadow-xs space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center bg-destructive/10 border border-destructive/20 text-destructive rounded-lg shadow-2xs animate-pulse">
                            <ShieldAlert className="size-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold tracking-tight text-foreground uppercase">
                                {isPermissionError ? "403 Forbidden" : "System Error"}
                            </h2>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                {isPermissionError ? "Security Gate / Authorization Failure" : "Report Retrieval Error"}
                            </p>
                        </div>
                        
                        <div className="bg-destructive/5 dark:bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg font-sans text-sm text-foreground/95 leading-relaxed text-left w-full select-text">
                            {isPermissionError 
                                ? "Your account does not possess the permissions required to view this content report resolution. Access is strictly limited to the reporter, the content creator, and community staff members."
                                : errorMessage || "The requested content report could not be found or has been completely removed."
                            }
                        </div>
                    </div>

                    <div className="border-t border-border pt-6 flex flex-col sm:flex-row gap-3">
                        <Button 
                            variant="outline" 
                            className="rounded-lg text-sm font-semibold h-9 flex-1"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Go Back
                        </Button>
                        <Button 
                            variant="outline" 
                            className="rounded-lg text-sm font-semibold h-9 flex-1"
                            onClick={() => router.push(`/communities/${communityId}`)}
                        >
                            <Terminal className="size-4 mr-2 text-emerald-500" />
                            View Community
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Cast the report to concrete DTOs to extract nested content models safely
    const postsReport = report as SelectCommunityPostsReportDTO;
    const qaReport = report as SelectCommunityQAPostReportsDTO;
    const answersReport = report as SelectCommunityAnswersReportDTO;
    const commentsReport = report as SelectCommunityCommentsReportDTO;

    const reportedPost = contentType === ContentType.Post ? postsReport.post : null;
    const reportedQAPost = contentType === ContentType.QA ? qaReport.qaPost : null;
    const reportedAnswer = contentType === ContentType.Answer ? answersReport.answer : null;
    const reportedComment = contentType === ContentType.Comment ? commentsReport.comment : null;

    const isResolved =
        report.status === ReportStatus.Resolved ||
        report.status === ReportStatus.Dismissed ||
        report.status === ReportStatus.Rejected;

    return (
        <div className="container max-w-4xl mx-auto px-4 py-4 h-[calc(100dvh-2rem)] flex flex-col justify-center">
            <div className="bg-card border-2 border-border/80 dark:border-border rounded-2xl shadow-md p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[calc(100dvh-4rem)] scrollbar-thin transition-shadow duration-300 hover:shadow-lg">
                {/* Header section with back links and meta info */}
                <ReportDetailHeader
                    communityId={communityId}
                    communityName={report.community?.name || undefined}
                    contentTypeLabel={getContentTypeLabel()}
                    dateCreated={report.dateCreated || new Date().toISOString()}
                    reportId={report.id}
                    isEmbedded={true}
                />

                <div className="h-px bg-border" />

                {/* Pulsing status panel with visual indicators */}
                <ReportStatusCard
                    status={report.status}
                    resolvedByName={report.resolvedBy?.fullName || null}
                    dateModified={report.dateModified}
                />

                {/* Action resolution card (rendered only if action is taken) */}
                {isResolved && (
                    <>
                        <div className="h-px bg-border" />
                        <ReportResolutionCard
                            action={report.resolutionAction}
                            notes={report.resolutionNotes}
                            resolvedBy={report.resolvedBy}
                        />
                    </>
                )}

                <div className="h-px bg-border" />

                {/* Highlighted report reason card */}
                <ReportReasonCard
                    reason={report.reason}
                    reporter={report.reporter}
                    isEmbedded={true}
                />

                <div className="h-px bg-border" />

                {/* Beautiful, responsive markdown reported content panel */}
                <ReportedContentCard
                    contentType={contentType}
                    reportedProfile={report.reportedProfile}
                    post={reportedPost}
                    qaPost={reportedQAPost}
                    answer={reportedAnswer}
                    comment={reportedComment}
                    isEmbedded={true}
                />

                <div className="h-px bg-border" />

                {/* Utility action dashboard buttons */}
                <ReportActions
                    communityId={communityId}
                    isStaff={isStaff}
                    isResolved={isResolved}
                    reporterProfileId={report.reporter?.id}
                    offenderProfileId={report.reportedProfile?.id}
                    isEmbedded={true}
                />
            </div>
        </div>
    );
}

