"use client";

import React from "react";
import { ContentType } from "@/types/content-media/content-type";
import { ReportStatus } from "@/types/community-content-report/report-status";
import { SortOrderType } from "@/constants/sortOrderType";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Filter,
    Clock,
    FileText,
    HelpCircle,
    CheckSquare,
    MessageSquare,
    ShieldAlert,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
} from "lucide-react";

interface ReportFilterPanelProps {
    contentType: ContentType;
    onContentTypeChange: (value: string) => void;
    statusFilter: ReportStatus | "ALL";
    onStatusFilterChange: (value: ReportStatus | "ALL") => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    sortField: string;
    onSortFieldChange: (field: string) => void;
    sortDir: SortOrderType;
    onSortDirChange: (dir: SortOrderType) => void;
}

function getContentTypeIcon(type: ContentType) {
    switch (type) {
        case ContentType.Post:
            return <FileText className="h-4 w-4 text-emerald-500 shrink-0" />;
        case ContentType.QA:
            return <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />;
        case ContentType.Answer:
            return <CheckSquare className="h-4 w-4 text-sky-500 shrink-0" />;
        case ContentType.Comment:
            return <MessageSquare className="h-4 w-4 text-rose-500 shrink-0" />;
        default:
            return <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
}

const STATUS_OPTIONS: { key: ReportStatus | "ALL"; label: string; icon: React.ReactNode }[] = [
    {
        key: "ALL",
        label: "All Statuses",
        icon: <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
    },
    {
        key: ReportStatus.Pending,
        label: "Pending",
        icon: <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />,
    },
    {
        key: ReportStatus.Resolved,
        label: "Resolved",
        icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />,
    },
    {
        key: ReportStatus.Rejected,
        label: "Rejected",
        icon: <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />,
    },
];

/** Section header strip — clearly visible separator between sidebar sections */
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/50 dark:bg-muted/20 border-y border-border">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 shrink-0">
                {icon}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-foreground/70">
                {label}
            </span>
        </div>
    );
}

export function ReportFilterPanel({
    contentType,
    onContentTypeChange,
    statusFilter,
    onStatusFilterChange,
    sortField,
    onSortFieldChange,
    sortDir,
    onSortDirChange,
}: ReportFilterPanelProps) {
    return (
        /* No divide-y here — SectionHeader uses border-y so it acts as its own full-width divider */
        <div className="flex flex-col">

            {/* ── Content Type ── */}
            <SectionHeader
                icon={<Filter className="h-3 w-3 text-primary" />}
                label="Content Type"
            />
            <div className="px-3 py-3">
                <Tabs
                    value={String(contentType)}
                    onValueChange={onContentTypeChange}
                    className="w-full"
                >
                    <TabsList className="flex flex-col gap-1 bg-transparent h-auto p-0 w-full">
                        {[
                            { value: ContentType.Post, label: "Posts" },
                            { value: ContentType.QA, label: "Q&A" },
                            { value: ContentType.Answer, label: "Answers" },
                            { value: ContentType.Comment, label: "Comments" },
                        ].map((type) => (
                            <TabsTrigger
                                key={type.value}
                                value={String(type.value)}
                                className="w-full flex items-center gap-3 justify-start px-3.5 py-2.5 text-left rounded-lg border border-transparent transition-all duration-150 cursor-pointer text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border/40 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/30 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm"
                            >
                                {getContentTypeIcon(type.value as ContentType)}
                                {type.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* ── Status Filter ── */}
            <SectionHeader
                icon={<Clock className="h-3 w-3 text-primary" />}
                label="Status"
            />
            <div className="px-3 py-3 flex flex-col gap-1">
                {STATUS_OPTIONS.map((status) => (
                    <button
                        key={status.key}
                        onClick={() => onStatusFilterChange(status.key)}
                        className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-sm font-medium ${
                            statusFilter === status.key
                                ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-sm"
                                : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border/40"
                        }`}
                    >
                        {status.icon}
                        {status.label}
                    </button>
                ))}
            </div>

            {/* ── Sort Controls ── */}
            <SectionHeader
                icon={<ArrowUpDown className="h-3 w-3 text-primary" />}
                label="Sort"
            />
            <div className="px-4 py-4 space-y-4">
                {/* Sort By */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block">
                        Sort By
                    </label>
                    <Select value={sortField} onValueChange={onSortFieldChange}>
                        <SelectTrigger className="w-full h-9 rounded-lg border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors shadow-sm">
                            <SelectValue placeholder="Sort Field" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg bg-card border-border text-sm shadow-lg">
                            <SelectItem value="DateCreated">Date Created</SelectItem>
                            <SelectItem value="Reason">Reason</SelectItem>
                            <SelectItem value="Status">Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Direction */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block">
                        Direction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: SortOrderType.ASC, label: "↑ ASC" },
                            { value: SortOrderType.DESC, label: "↓ DESC" },
                        ].map((dir) => (
                            <button
                                key={dir.value}
                                onClick={() => onSortDirChange(dir.value)}
                                className={`py-2.5 rounded-lg border text-center transition-all duration-150 cursor-pointer text-xs font-bold uppercase tracking-wider ${
                                    sortDir === dir.value
                                        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                                        : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border/80"
                                }`}
                            >
                                {dir.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
