"use client";

import React from "react";
import { ContentType } from "@/types/content-media/content-type";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ArrowUpRight, User, Flag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AnyCommunityReportDTO } from "./reports-list-container";
import { ReportStatus } from "@/types/community-content-report/report-status";
import { getReportContentDetails, getStatusBadge, getResolutionActionLabel } from "./report-helpers";

interface ReportInspectDrawerProps {
    report: AnyCommunityReportDTO | null;
    contentType: ContentType;
    onClose: () => void;
}

interface AvatarBlockProps {
    avatarUrl?: string | null;
    fullName?: string | null;
    label: string;
}

function AvatarBlock({ avatarUrl, fullName, label }: AvatarBlockProps) {
    const initials = (fullName ?? "?")[0].toUpperCase();
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
                <div className="relative w-8 h-8 rounded-full border border-border bg-muted shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={fullName || label}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>
                <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                    {fullName || "Anonymous"}
                </span>
            </div>
        </div>
    );
}

export function ReportInspectDrawer({ report, contentType, onClose }: ReportInspectDrawerProps) {
    if (!report) return null;

    const details = getReportContentDetails(report, contentType);

    return (
        <Sheet open={!!report} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-lg bg-background border-l border-border p-0 overflow-y-auto">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-border bg-card/80 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
                            Inspection View
                        </span>
                        {getStatusBadge(report.status)}
                    </div>
                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                        </div>
                        Report Details
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-1.5 rounded-md border border-border">
                        ID: {report.id}
                    </SheetDescription>
                </SheetHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Actors Card */}
                    <Card className="border border-border bg-card shadow-sm">
                        <CardContent className="pt-4 pb-4 px-4">
                            <div className="grid grid-cols-2 gap-4 divide-x divide-border/40">
                                <AvatarBlock
                                    avatarUrl={report.reporter?.avatarUrl}
                                    fullName={report.reporter?.fullName}
                                    label="Reporter"
                                />
                                <div className="pl-4">
                                    <AvatarBlock
                                        avatarUrl={report.reportedProfile?.avatarUrl}
                                        fullName={report.reportedProfile?.fullName}
                                        label="Reported User"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Reason */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Report Reason
                            </span>
                        </div>
                        <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm">
                            <CardContent className="pt-3 pb-3 px-4">
                                <p className="text-sm text-foreground italic leading-relaxed">
                                    &ldquo;{report.reason}&rdquo;
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reported Content Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    Reported {details.typeLabel}
                                </span>
                            </div>
                            <Link
                                href={details.link}
                                target="_blank"
                                className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                            >
                                View Original
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <Card className="border border-border bg-muted/40 shadow-sm">
                            <CardContent className="pt-3 pb-3 px-4 space-y-2">
                                <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                                    {details.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                                    {details.preview}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resolution Info */}
                    {report.status !== ReportStatus.Pending && (
                        <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Resolution History
                            </span>
                            <Card className="border border-border bg-card shadow-sm">
                                <CardContent className="pt-3 pb-3 px-4 space-y-3 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Resolved by</span>
                                        <span className="font-semibold text-foreground">
                                            {report.resolvedBy?.fullName || "System/Moderator"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-border pt-3">
                                        <span className="text-muted-foreground">Action taken</span>
                                        <span className="font-bold text-amber-500">
                                            {getResolutionActionLabel(report.resolutionAction)}
                                        </span>
                                    </div>
                                    {report.resolutionNotes && (
                                        <div className="border-t border-border pt-3 space-y-1.5">
                                            <span className="text-muted-foreground block">Notes</span>
                                            <p className="text-foreground italic leading-relaxed">
                                                &ldquo;{report.resolutionNotes}&rdquo;
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
