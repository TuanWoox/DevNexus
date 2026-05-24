"use client";

import { SelectCommunityReportProfileDTO } from "@/types/community-content-report/base-select-community-report-dto";
import { AlertOctagon } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";

interface ReportReasonCardProps {
    reason: string;
    reporter?: SelectCommunityReportProfileDTO | null;
    isEmbedded?: boolean;
}

export function ReportReasonCard({ reason, reporter, isEmbedded = false }: ReportReasonCardProps) {
    const initials = reporter?.fullName
        ? reporter.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "RP";

    const containerClasses = isEmbedded
        ? "space-y-4"
        : "bg-card border border-border p-6 rounded-xl shadow-xs space-y-4 transition-all hover:shadow-sm";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                    <AlertOctagon className="size-4.5 animate-pulse" />
                    <span>Report Reason</span>
                </div>
                {reporter && (
                    <ProfileHoverCard profileId={reporter.id} author={reporter}>
                        <div className="flex items-center gap-2 bg-muted/40 border border-border px-2.5 py-1 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                            <UserAvatar
                                avatarUrl={reporter.avatarUrl}
                                fullName={reporter.fullName}
                                className="h-5.5 w-5.5 border border-border"
                            />
                            <span className="text-xs text-muted-foreground">
                                Reporter: <span className="text-foreground font-semibold hover:underline">{reporter.fullName}</span>
                            </span>
                        </div>
                    </ProfileHoverCard>
                )}
            </div>

            <div className="bg-destructive/5 dark:bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg font-sans text-sm text-foreground/90 leading-relaxed min-h-[60px] whitespace-pre-wrap select-text">
                {reason || "No specific reason provided."}
            </div>
        </div>
    );
}

