"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, Loader2, Trash2, VolumeX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ContentType } from "@/types/content-media/content-type";
import { ReportResolutionAction } from "@/types/community-content-report/report-resolution-action";
import { useResolveCommunityReport } from "@/hooks/community-content-report-hooks/use-resolve-community-report";
import { AnyCommunityReportDTO } from "./reports-list-container";
import { getReportContentDetails } from "./report-helpers";

interface ReportActionDialogProps {
    open: boolean;
    report: AnyCommunityReportDTO | null;
    contentType: ContentType;
    communityId: string;
    onClose: () => void;
}

const actions = [
    {
        value: ReportResolutionAction.Reject,
        label: "Reject",
        description: "Mark this report as invalid. No action on content.",
        icon: XCircle,
        className: "border-rose-500/30 bg-rose-500/5 text-rose-500",
        selectedClass: "border-rose-500/80 bg-rose-500/5 dark:bg-rose-500/10 ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-400",
        iconSelectedClass: "border-rose-500/60 bg-rose-500/20 text-rose-500 dark:text-rose-400",
    },
    {
        value: ReportResolutionAction.RemoveContent,
        label: "Remove Content",
        description: "Soft-delete the content. Resolve all duplicate reports.",
        icon: Trash2,
        className: "border-orange-500/30 bg-orange-500/5 text-orange-500",
        selectedClass: "border-orange-500/80 bg-orange-500/5 dark:bg-orange-500/10 ring-2 ring-orange-500/20 text-orange-600 dark:text-orange-400",
        iconSelectedClass: "border-orange-500/60 bg-orange-500/20 text-orange-500 dark:text-orange-400",
    },
    {
        value: ReportResolutionAction.RemoveContentAndMute,
        label: "Remove Content and Mute",
        description: "Delete content and mute the offender. Resolve all duplicates.",
        icon: VolumeX,
        className: "border-amber-500/30 bg-amber-500/5 text-amber-500",
        selectedClass: "border-amber-500/80 bg-amber-500/5 dark:bg-amber-500/10 ring-2 ring-amber-500/20 text-amber-600 dark:text-amber-400",
        iconSelectedClass: "border-amber-500/60 bg-amber-500/20 text-amber-500 dark:text-amber-400",
    },
    {
        value: ReportResolutionAction.RemoveContentAndBan,
        label: "Remove Content and Ban",
        description: "Delete content and permanently ban the offender. Resolve all duplicates.",
        icon: Ban,
        className: "border-red-500/30 bg-red-500/5 text-red-500",
        selectedClass: "border-red-500/80 bg-red-500/5 dark:bg-red-500/10 ring-2 ring-red-500/20 text-red-600 dark:text-red-400",
        iconSelectedClass: "border-red-500/60 bg-red-500/20 text-red-500 dark:text-red-400",
    },
    {
        value: ReportResolutionAction.PenalizeReporter,
        label: "Penalize Reporter",
        description: "Reject this report and mute the reporter for 3 days.",
        icon: AlertTriangle,
        className: "border-fuchsia-500/30 bg-fuchsia-500/5 text-fuchsia-500",
        selectedClass: "border-fuchsia-500/80 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 ring-2 ring-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
        iconSelectedClass: "border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400",
    },
] as const;

const muteDurations = [
    { label: "1h", hours: 1 },
    { label: "3h", hours: 3 },
    { label: "24h", hours: 24 },
    { label: "72h", hours: 72 },
    { label: "168h", hours: 168 },
    { label: "Permanent", hours: null },
] as const;

export function ReportActionDialog({
    open,
    report,
    contentType,
    communityId,
    onClose,
}: ReportActionDialogProps) {
    const [action, setAction] = useState<ReportResolutionAction | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [muteHours, setMuteHours] = useState<number | null>(24);
    const resolveMutation = useResolveCommunityReport(communityId);

    const details = useMemo(
        () => (report ? getReportContentDetails(report, contentType) : null),
        [report, contentType]
    );

    useEffect(() => {
        if (!open) {
            setAction(null);
            setResolutionNotes("");
            setMuteHours(24);
        }
    }, [open]);

    if (!report) return null;

    const handleConfirm = async () => {
        if (!action) return;

        const mutedUntil =
            action === ReportResolutionAction.RemoveContentAndMute && muteHours !== null
                ? new Date(Date.now() + muteHours * 60 * 60 * 1000).toISOString()
                : undefined;

        const resolved = await resolveMutation.mutateAsync({
            contentType,
            payload: {
                reportId: report.id,
                action,
                resolutionNotes: resolutionNotes.trim() || undefined,
                mutedUntil,
            },
        });

        if (resolved) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden shadow-2xl border border-border ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md">
                <DialogHeader className="px-6 py-5 border-b border-border bg-muted/15 dark:bg-muted/5">
                    <DialogTitle className="text-base font-semibold text-foreground">Take Report Action</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary">
                            {details?.typeLabel}
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[280px] sm:max-w-md">
                            {details?.title}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                    {details && (
                        <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/10 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                        Reported Content Context
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    ID: <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded select-all">{details.contentId.slice(0, 8)}...</span>
                                </span>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground leading-snug">
                                    {details.title}
                                </h4>
                                {details.preview && (
                                    <blockquote className="text-xs text-muted-foreground border-l-2 border-border pl-3 py-1.5 font-mono leading-relaxed bg-background/80 dark:bg-background/40 p-2.5 rounded-lg italic max-h-[120px] overflow-y-auto select-text scrollbar-thin scrollbar-thumb-muted-foreground/30">
                                        "{details.preview}"
                                    </blockquote>
                                )}
                            </div>
                        </div>
                    )}

                    {details && <hr className="border-border" />}

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                Resolution Action
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {actions.map((item) => {
                                const Icon = item.icon;
                                const selected = action === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setAction(item.value)}
                                        className={cn(
                                            "text-left rounded-xl border p-4.5 transition-all duration-200 hover:scale-[1.01] hover:-translate-y-[1px] active:scale-[0.99]",
                                            selected 
                                                ? item.selectedClass 
                                                : "border-border bg-muted/30 dark:bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/60 dark:hover:bg-muted/20 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <span className={cn("rounded-lg border p-2 shrink-0 transition-colors duration-200", selected ? item.iconSelectedClass : item.className)}>
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="space-y-1 min-w-0">
                                                <span className="block text-sm font-semibold text-foreground transition-colors duration-200">
                                                    {item.label}
                                                </span>
                                                <span className="block text-[11px] leading-relaxed text-muted-foreground/90 transition-colors duration-200">
                                                    {item.description}
                                                </span>
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {action === ReportResolutionAction.RemoveContentAndMute && (
                        <>
                            <hr className="border-border" />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                        Mute Duration
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {muteDurations.map((duration) => {
                                        const active = muteHours === duration.hours;
                                        return (
                                            <Button
                                                key={duration.label}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-9 rounded-lg font-medium text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                                                    active
                                                        ? "border-amber-500/80 bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                                                        : "border-border bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/30"
                                                )}
                                                onClick={() => setMuteHours(duration.hours)}
                                            >
                                                {duration.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    <hr className="border-border" />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                    Resolution Notes
                                </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">Optional</span>
                        </div>
                        <Textarea
                            value={resolutionNotes}
                            onChange={(event) => setResolutionNotes(event.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Describe why this action was taken..."
                            className="resize-none rounded-xl border border-border bg-muted/30 dark:bg-muted/10 p-3.5 text-xs text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50"
                        />
                        <p className="text-right text-[10px] text-muted-foreground font-mono">
                            {resolutionNotes.length} / 1000
                        </p>
                    </div>
                </div>

                <DialogFooter className="m-0 rounded-none px-6 py-4 border-t border-border bg-muted/40 dark:bg-muted/10 flex sm:justify-end gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="rounded-lg h-9 text-xs font-semibold px-4 border-border hover:bg-muted/30 hover:border-muted-foreground/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!action || resolveMutation.isPending}
                        className={cn(
                            "rounded-lg h-9 text-xs font-semibold px-5 gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                            action
                                ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20"
                                : "bg-muted/50 text-muted-foreground/60 border border-border"
                        )}
                    >
                        {resolveMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Apply Action
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
