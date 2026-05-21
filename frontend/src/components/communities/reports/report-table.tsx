"use client";

import React from "react";
import { ContentType } from "@/types/content-media/content-type";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, AlertTriangle, Eye, MoreHorizontal, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { AnyCommunityReportDTO } from "./reports-list-container";
import { getReportContentDetails, getResolutionActionLabel, getStatusBadge } from "./report-helpers";
import { ReportStatus } from "@/types/community-content-report/report-status";
import { ReportResolutionAction } from "@/types/community-content-report/report-resolution-action";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";

const DEFAULT_AVATAR_URL = "/images/default-avatar.webp";

interface ReportTableProps {
    reports: AnyCommunityReportDTO[];
    contentType: ContentType;
    isLoading: boolean;
    isModeratorOrOwner: boolean;
    onInspect: (report: AnyCommunityReportDTO) => void;
    onAction: (report: AnyCommunityReportDTO) => void;
}

export function ReportTable({ reports, contentType, isLoading, isModeratorOrOwner, onInspect, onAction }: ReportTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-x-auto bg-card shadow-sm">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="absolute inset-0 h-8 w-8 rounded-full bg-primary/10 animate-ping" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground animate-pulse">
                        Loading reports...
                    </span>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border bg-muted/40">
                            <TableHead className="font-semibold text-xs text-foreground h-11 pl-5">
                                Reporter
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-foreground h-11">
                                Reported Content
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-foreground h-11">
                                Reason
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-foreground h-11">
                                Status
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-foreground h-11">
                                Date
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs text-foreground h-11 pr-5">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={6}
                                    className="h-52 text-center"
                                >
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                                            <AlertTriangle className="h-6 w-6 text-muted-foreground/60" />
                                        </div>
                                        <p className="text-sm font-medium">No reports found</p>
                                        <p className="text-xs text-muted-foreground/70">
                                            Try adjusting your filters to see more results.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => {
                                const details = getReportContentDetails(report, contentType);
                                return (
                                    <TableRow
                                        key={report.id}
                                        className="hover:bg-muted/30 border-b border-border/40 transition-colors duration-150 group"
                                    >
                                        {/* Reporter */}
                                        <TableCell className="py-4 pl-5">
                                            <ProfileHoverCard profileId={report.reporterId} author={report.reporter ?? undefined}>
                                                <div className="flex items-center gap-3 cursor-pointer">
                                                    <div className="relative w-8 h-8 rounded-full border border-border/50 bg-muted shrink-0 overflow-hidden">
                                                        <Image
                                                            src={report.reporter?.avatarUrl || DEFAULT_AVATAR_URL}
                                                            alt={report.reporter?.fullName || "Reporter"}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs text-foreground max-w-[120px] truncate hover:text-primary">
                                                            {report.reporter?.fullName || "Anonymous"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Reporter
                                                        </span>
                                                    </div>
                                                </div>
                                            </ProfileHoverCard>
                                        </TableCell>

                                        {/* Reported Content */}
                                        <TableCell className="py-4 max-w-[200px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-xs text-foreground line-clamp-1">
                                                    {details.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                    {details.preview}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Reason */}
                                        <TableCell className="py-4 max-w-[180px]">
                                            <span className="text-xs text-muted-foreground truncate block">
                                                {report.reason}
                                            </span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-4">
                                            <div className="flex flex-col items-start gap-1.5">
                                                {getStatusBadge(report.status)}
                                                {report.resolutionAction !== ReportResolutionAction.None && (
                                                    <span className="max-w-[180px] truncate text-[10px] font-semibold text-muted-foreground">
                                                        {getResolutionActionLabel(report.resolutionAction)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="py-4">
                                            <span className="text-[11px] text-muted-foreground">
                                                {report.dateCreated
                                                    ? new Date(report.dateCreated).toLocaleDateString()
                                                    : "N/A"}
                                            </span>
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell className="py-4 text-right pr-5">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="icon-sm"
                                                        variant="outline"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => onInspect(report)}>
                                                        <Eye className="h-4 w-4" />
                                                        Open Inspect
                                                    </DropdownMenuItem>
                                                    {report.status === ReportStatus.Pending && isModeratorOrOwner && (
                                                        <DropdownMenuItem onClick={() => onAction(report)}>
                                                            <ShieldAlert className="h-4 w-4" />
                                                            Take Action
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
