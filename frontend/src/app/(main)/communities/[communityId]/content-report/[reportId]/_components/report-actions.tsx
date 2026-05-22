"use client";

import Link from "next/link";
import { ExternalLink, ShieldAlert, Award, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportActionsProps {
    communityId: string;
    isStaff: boolean;
    isResolved: boolean;
    reporterProfileId?: string;
    offenderProfileId?: string;
    isEmbedded?: boolean;
}

export function ReportActions({
    communityId,
    isStaff,
    isResolved,
    reporterProfileId,
    offenderProfileId,
    isEmbedded = false,
}: ReportActionsProps) {
    const containerClasses = isEmbedded
        ? "flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between transition-all"
        : "flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between bg-card border border-border p-6 rounded-xl shadow-xs transition-all hover:shadow-sm";

    return (
        <div className={containerClasses}>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                {reporterProfileId && (
                    <Button asChild variant="outline" size="sm" className="rounded-lg text-xs font-semibold h-9 w-full sm:w-auto">
                        <Link href={`/profile/${reporterProfileId}`} target="_blank" className="flex items-center gap-1.5">
                            Reporter Profile
                            <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                    </Button>
                )}

                {offenderProfileId && (
                    <Button asChild variant="outline" size="sm" className="rounded-lg text-xs font-semibold h-9 w-full sm:w-auto">
                        <Link href={`/profile/${offenderProfileId}`} target="_blank" className="flex items-center gap-1.5">
                            Offender Profile
                            <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-end mt-2 sm:mt-0">
                {isResolved ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-center tracking-wide">
                        <Award className="size-4 animate-pulse" />
                        <span>CASE ARCHIVED</span>
                    </div>
                ) : isStaff ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-center tracking-wide">
                        <ShieldAlert className="size-4 animate-bounce" style={{ animationDuration: '3s' }} />
                        <span>AWAITING RESOLUTION</span>
                    </div>
                ) : (
                    <div className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                        CASE ACTIVE
                    </div>
                )}
            </div>
        </div>
    );
}

