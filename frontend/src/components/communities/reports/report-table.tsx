"use client";

import React from "react";
import { ContentType } from "@/types/content-media/content-type";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Eye } from "lucide-react";
import Image from "next/image";
import { AnyCommunityReportDTO } from "./reports-list-container";
import { getReportContentDetails, getStatusBadge } from "./report-helpers";

interface ReportTableProps {
    reports: AnyCommunityReportDTO[];
    contentType: ContentType;
    isLoading: boolean;
    onInspect: (report: AnyCommunityReportDTO) => void;
}

export function ReportTable({ reports, contentType, isLoading, onInspect }: ReportTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
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
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8 rounded-full border border-border/50 bg-muted shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                                    {report.reporter?.avatarUrl ? (
                                                        <Image
                                                            src={report.reporter.avatarUrl}
                                                            alt={report.reporter.fullName || "Reporter"}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        (report.reporter?.fullName ?? "?")[0].toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs text-foreground max-w-[120px] truncate">
                                                        {report.reporter?.fullName || "Anonymous"}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Reporter
                                                    </span>
                                                </div>
                                            </div>
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
                                            {getStatusBadge(report.status)}
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
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-md border border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-xs font-medium px-3 cursor-pointer transition-all duration-200 gap-1.5 group-hover:border-border"
                                                onClick={() => onInspect(report)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Inspect
                                            </Button>
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
