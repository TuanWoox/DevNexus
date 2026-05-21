"use client";

import { ContentType } from "@/types/content-media/content-type";
import { SelectCommunityReportProfileDTO } from "@/types/community-content-report/base-select-community-report-dto";
import { SelectReportedPostDTO, SelectReportedQAPostDTO, SelectReportedAnswerDTO, SelectReportedCommentDTO } from "@/types/community-content-report/select-reported-content-dto";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FileText, MessageSquare, HelpCircle, MessageCircle, Calendar } from "lucide-react";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";

interface ReportedContentCardProps {
    contentType: ContentType;
    reportedProfile?: SelectCommunityReportProfileDTO | null;
    post?: SelectReportedPostDTO | null;
    qaPost?: SelectReportedQAPostDTO | null;
    answer?: SelectReportedAnswerDTO | null;
    comment?: SelectReportedCommentDTO | null;
    isEmbedded?: boolean;
}

export function ReportedContentCard({
    contentType,
    reportedProfile,
    post,
    qaPost,
    answer,
    comment,
    isEmbedded = false,
}: ReportedContentCardProps) {
    const getContentDetails = () => {
        switch (contentType) {
            case ContentType.Post:
                return {
                    title: post?.title,
                    text: post?.contentPreview,
                    date: post?.dateCreated,
                    icon: <FileText className="size-4 text-emerald-500 dark:text-emerald-400" />,
                    typeLabel: "Community Post",
                    contextInfo: null,
                };
            case ContentType.QA:
                return {
                    title: qaPost?.title,
                    text: qaPost?.contentPreview,
                    date: qaPost?.dateCreated,
                    icon: <HelpCircle className="size-4 text-orange-500 dark:text-orange-400" />,
                    typeLabel: "Q&A Question",
                    contextInfo: null,
                };
            case ContentType.Answer:
                return {
                    title: null,
                    text: answer?.contentPreview,
                    date: answer?.dateCreated,
                    icon: <MessageCircle className="size-4 text-sky-500 dark:text-sky-400" />,
                    typeLabel: "Q&A Answer",
                    contextInfo: answer?.qaPostTitle ? `In response to question: "${answer.qaPostTitle}"` : null,
                };
            case ContentType.Comment:
                return {
                    title: null,
                    text: comment?.contentPreview,
                    date: comment?.dateCreated,
                    icon: <MessageSquare className="size-4 text-amber-500 dark:text-amber-400" />,
                    typeLabel: "Comment",
                    contextInfo: comment?.postTitle
                        ? `On post: "${comment.postTitle}"`
                        : comment?.qaPostTitle
                        ? `On Q&A: "${comment.qaPostTitle}"`
                        : null,
                };
            default:
                return {
                    title: "Unknown Content",
                    text: "",
                    date: null,
                    icon: <FileText className="size-4" />,
                    typeLabel: "Content",
                    contextInfo: null,
                };
        }
    };

    const details = getContentDetails();
    if (!details.text) {
        return (
            <div className={isEmbedded ? "text-center py-6" : "bg-card border border-border p-6 rounded-xl shadow-xs text-center py-12"}>
                <span className="text-muted-foreground text-xs uppercase font-medium tracking-wider block mb-2">Reported Content</span>
                <p className="text-sm font-semibold text-muted-foreground">Content has been completely removed or is unavailable.</p>
            </div>
        );
    }

    const initials = reportedProfile?.fullName
        ? reportedProfile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    const formattedDate = details.date
        ? new Date(details.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : null;

    const containerClasses = isEmbedded
        ? "space-y-5"
        : "bg-card border border-border p-6 rounded-xl shadow-xs space-y-5 transition-all hover:shadow-sm";

    return (
        <div className={containerClasses}>
            {/* Header / Meta Info */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    {reportedProfile ? (
                        <ProfileHoverCard profileId={reportedProfile.id} author={reportedProfile}>
                            <div className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity group">
                                <UserAvatar
                                    avatarUrl={reportedProfile.avatarUrl}
                                    fullName={reportedProfile.fullName}
                                    className="h-9 w-9 border border-border shadow-2xs"
                                />
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Creator</span>
                                        <span className="text-sm font-sans font-bold text-foreground group-hover:underline">
                                            {reportedProfile.fullName || "Unknown User"}
                                        </span>
                                    </div>
                                    {formattedDate && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                            <Calendar className="size-3" />
                                            <span>PUBLISHED {formattedDate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ProfileHoverCard>
                    ) : (
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                avatarUrl={null}
                                fullName="Unknown User"
                                className="h-9 w-9 border border-border shadow-2xs"
                            />
                            <div>
                                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Creator</span>
                                <span className="text-sm font-sans font-bold text-foreground block">
                                    Unknown User
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground shadow-2xs">
                    {details.icon}
                    <span>{details.typeLabel}</span>
                </div>
            </div>

            {/* Context Info (e.g., Parent Q&A or Post Title) */}
            {details.contextInfo && (
                <div className="text-xs bg-muted/40 border-l-4 border-border px-3 py-1.5 text-muted-foreground rounded-r-xs">
                    {details.contextInfo}
                </div>
            )}

            {/* Content Display */}
            <div className="space-y-3">
                {details.title && (
                    <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug">
                        {details.title}
                    </h3>
                )}
                
                {/* Render full markdown of the reported content */}
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none bg-muted/30 border border-border p-5 rounded-xl font-sans leading-relaxed text-foreground/90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{details.text}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

