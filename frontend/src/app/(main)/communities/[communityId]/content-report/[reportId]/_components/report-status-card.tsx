"use client";

import { ReportStatus } from "@/types/report/report-status";
import { Clock, CheckCircle, AlertOctagon, RefreshCw } from "lucide-react";

interface ReportStatusCardProps {
    status: ReportStatus;
    resolvedByName?: string | null;
    dateModified?: string | null;
}

export function ReportStatusCard({ status, resolvedByName, dateModified }: ReportStatusCardProps) {
    const getStatusConfig = () => {
        switch (status) {
            case ReportStatus.Pending:
                return {
                    label: "Pending Review",
                    description: "This report is currently queued and awaiting review by the community administrators or moderators.",
                    bgColor: "bg-amber-500/5 dark:bg-amber-500/10",
                    borderColor: "border-amber-500/20",
                    textColor: "text-amber-600 dark:text-amber-400",
                    icon: <Clock className="size-5 animate-pulse" />,
                    accentColor: "bg-amber-500 animate-pulse",
                };
            case ReportStatus.InReview:
                return {
                    label: "In Review",
                    description: "A moderator has opened this report and is currently auditing the reported content.",
                    bgColor: "bg-blue-500/5 dark:bg-blue-500/10",
                    borderColor: "border-blue-500/20",
                    textColor: "text-blue-600 dark:text-blue-400",
                    icon: <RefreshCw className="size-5 animate-spin" style={{ animationDuration: '4s' }} />,
                    accentColor: "bg-blue-500",
                };
            case ReportStatus.Resolved:
                return {
                    label: "Resolved",
                    description: `This report has been reviewed and resolved by community staff${resolvedByName ? ` (${resolvedByName})` : ""}. Action has been taken.`,
                    bgColor: "bg-emerald-500/5 dark:bg-emerald-500/10",
                    borderColor: "border-emerald-500/20",
                    textColor: "text-emerald-600 dark:text-emerald-400",
                    icon: <CheckCircle className="size-5" />,
                    accentColor: "bg-emerald-500",
                };
            case ReportStatus.Rejected:
            case ReportStatus.Dismissed:
                return {
                    label: status === ReportStatus.Rejected ? "Rejected" : "Dismissed",
                    description: `This report has been closed with no action taken${resolvedByName ? ` by ${resolvedByName}` : ""}. The content does not violate guidelines.`,
                    bgColor: "bg-muted/40",
                    borderColor: "border-border",
                    textColor: "text-muted-foreground",
                    icon: <AlertOctagon className="size-5" />,
                    accentColor: "bg-muted-foreground",
                };
            default:
                return {
                    label: "Unknown Status",
                    description: "The status of this report is undetermined.",
                    bgColor: "bg-muted/40",
                    borderColor: "border-border",
                    textColor: "text-muted-foreground",
                    icon: <Clock className="size-5" />,
                    accentColor: "bg-muted-foreground",
                };
        }
    };

    const config = getStatusConfig();
    const formattedDate = dateModified
        ? new Date(dateModified).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : null;

    return (
        <div className={`border ${config.borderColor} ${config.bgColor} p-6 rounded-xl shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:shadow-sm`}>
            <div className="flex gap-4 items-start sm:items-center">
                <div className={`p-2 border border-border rounded-lg bg-background ${config.textColor} shadow-2xs`}>
                    {config.icon}
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${config.accentColor} inline-block`} />
                        <h3 className={`text-md font-semibold tracking-tight ${config.textColor}`}>
                            {config.label}
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                        {config.description}
                    </p>
                </div>
            </div>
            {formattedDate && (
                <div className="text-left font-sans text-xs text-muted-foreground border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium tracking-wider">Last Update</span>
                    <span className="text-foreground font-semibold whitespace-nowrap">{formattedDate}</span>
                </div>
            )}
        </div>
    );
}

