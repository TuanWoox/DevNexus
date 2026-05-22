"use client";

import { ReportResolutionAction } from "@/types/community-content-report/report-resolution-action";
import { SelectCommunityReportProfileDTO } from "@/types/community-content-report/base-select-community-report-dto";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ShieldCheck, UserMinus, ShieldAlert, CheckCircle, Info } from "lucide-react";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";

interface ReportResolutionCardProps {
    action: ReportResolutionAction;
    notes?: string | null;
    resolvedBy?: SelectCommunityReportProfileDTO | null;
}

export function ReportResolutionCard({ action, notes, resolvedBy }: ReportResolutionCardProps) {
    if (action === ReportResolutionAction.None) {
        return null;
    }

    const getActionConfig = () => {
        switch (action) {
            case ReportResolutionAction.Reject:
                return {
                    title: "Report Dismissed",
                    subtitle: "No guidelines violation was found. No penalties applied.",
                    borderColor: "border-border",
                    bgColor: "bg-card",
                    accentColor: "text-muted-foreground bg-muted border-border",
                    icon: <CheckCircle className="size-5" />,
                };
            case ReportResolutionAction.RemoveContent:
                return {
                    title: "Content Removed",
                    subtitle: "The reported content was identified as a guideline violation and has been removed.",
                    borderColor: "border-destructive/20",
                    bgColor: "bg-destructive/5 dark:bg-destructive/10",
                    accentColor: "text-destructive bg-destructive/10 border-destructive/20",
                    icon: <ShieldAlert className="size-5" />,
                };
            case ReportResolutionAction.RemoveContentAndMute:
                return {
                    title: "Content Removed & Creator Muted",
                    subtitle: "The reported content was removed, and the creator's posting privileges have been temporarily suspended.",
                    borderColor: "border-amber-500/20",
                    bgColor: "bg-amber-500/5 dark:bg-amber-500/10",
                    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                    icon: <UserMinus className="size-5" />,
                };
            case ReportResolutionAction.RemoveContentAndBan:
                return {
                    title: "Content Removed & Creator Banned",
                    subtitle: "The reported content was removed, and the creator has been permanently banned from this community.",
                    borderColor: "border-destructive/20",
                    bgColor: "bg-destructive/5 dark:bg-destructive/10",
                    accentColor: "text-destructive bg-destructive/10 border-destructive/20",
                    icon: <ShieldCheck className="size-5" />,
                };
            case ReportResolutionAction.PenalizeReporter:
                return {
                    title: "Reporter Penalized (False Reporting)",
                    subtitle: "This report was deemed malicious or false. The reporter's privileges have been temporarily suspended.",
                    borderColor: "border-amber-500/20",
                    bgColor: "bg-amber-500/5 dark:bg-amber-500/10",
                    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                    icon: <ShieldAlert className="size-5 animate-bounce" style={{ animationDuration: '3s' }} />,
                };
            default:
                return {
                    title: "Action Taken",
                    subtitle: "A resolution has been applied to this report.",
                    borderColor: "border-border",
                    bgColor: "bg-card",
                    accentColor: "text-muted-foreground bg-muted border-border",
                    icon: <Info className="size-5" />,
                };
        }
    };

    const config = getActionConfig();
    const resolverInitials = resolvedBy?.fullName
        ? resolvedBy.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "ST";

    return (
        <div className={`border ${config.borderColor} ${config.bgColor} p-6 rounded-xl shadow-xs space-y-6 transition-all hover:shadow-sm`}>
            {/* Header section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border pb-4">
                <div className="flex gap-3 items-center">
                    <div className={`flex h-10 w-10 items-center justify-center border rounded-lg ${config.accentColor} shadow-2xs`}>
                        {config.icon}
                    </div>
                    <div>
                        <h2 className="text-md font-semibold tracking-tight text-foreground flex items-center gap-2">
                            {config.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl font-normal mt-0.5">
                            {config.subtitle}
                        </p>
                    </div>
                </div>

                {resolvedBy && (
                    <ProfileHoverCard profileId={resolvedBy.id} author={resolvedBy}>
                        <div className="flex items-center gap-2.5 bg-muted/40 border border-border px-3 py-1.5 rounded-lg self-stretch sm:self-auto justify-start cursor-pointer hover:bg-muted/70 transition-colors">
                            <UserAvatar
                                avatarUrl={resolvedBy.avatarUrl}
                                fullName={resolvedBy.fullName}
                                className="h-7 w-7 border border-border"
                            />
                            <div className="text-xs leading-normal">
                                <span className="text-muted-foreground block text-[9px] font-medium uppercase tracking-wider">Resolved By</span>
                                <span className="text-foreground font-semibold hover:underline">{resolvedBy.fullName}</span>
                            </div>
                        </div>
                    </ProfileHoverCard>
                )}
            </div>

            {/* Markdown resolution notes */}
            {notes && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Moderator Resolution Notes</h4>
                    <div className="prose prose-sm prose-invert max-w-none bg-muted/30 border border-border p-4 rounded-lg font-sans leading-relaxed text-foreground/90">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}

