"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert, Calendar } from "lucide-react";

interface ReportDetailHeaderProps {
    communityId: string;
    communityName?: string;
    contentTypeLabel: string;
    dateCreated: string;
    reportId: string;
    isEmbedded?: boolean;
}

export function ReportDetailHeader({
    communityId,
    communityName,
    contentTypeLabel,
    dateCreated,
    reportId,
    isEmbedded = false,
}: ReportDetailHeaderProps) {
    const formattedDate = new Date(dateCreated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const containerClasses = isEmbedded
        ? "flex flex-col md:flex-row md:items-center justify-between gap-6"
        : "flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-xl shadow-xs transition-shadow hover:shadow-sm";

    return (
        <div className={containerClasses}>
            <div className="space-y-3">
                <Link
                    href={`/communities/${communityId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors group"
                >
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Back to Feed
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-destructive/10 border border-destructive/20 text-destructive rounded-lg shadow-2xs">
                        <ShieldAlert className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Report Details
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            ID: <span className="font-mono text-foreground font-semibold select-all">{reportId}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 text-sm">
                <div className="border-l border-border pl-4 py-1">
                    <span className="text-muted-foreground text-xs block mb-0.5">Community</span>
                    <Link
                        href={`/communities/${communityId}`}
                        className="text-foreground hover:underline font-semibold transition-colors"
                    >
                        {communityName || "Community"}
                    </Link>
                </div>
                <div className="border-l border-border pl-4 py-1">
                    <span className="text-muted-foreground text-xs block mb-0.5">Content Type</span>
                    <span className="text-foreground font-semibold">{contentTypeLabel}</span>
                </div>
                <div className="border-l border-border pl-4 py-1">
                    <span className="text-muted-foreground text-xs block mb-0.5">Filed On</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                        <Calendar className="size-4 text-muted-foreground" />
                        {formattedDate}
                    </span>
                </div>
            </div>
        </div>
    );
}

