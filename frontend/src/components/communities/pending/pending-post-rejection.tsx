"use client";

import { AlertTriangle, CornerDownRight } from "lucide-react";

interface PendingPostRejectionProps {
    reason?: string | null;
}

export function PendingPostRejection({ reason }: PendingPostRejectionProps) {
    if (!reason) return null;

    return (
        <div className="flex gap-3 rounded-lg border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 p-3.5 shadow-inner-ai/5 border-l-4 border-l-destructive">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <CornerDownRight className="h-3 w-3 text-destructive/60" />
                    <span className="text-2xs font-semibold uppercase tracking-wider text-destructive">
                        Moderation Feedback
                    </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic select-text">
                    "{reason}"
                </p>
            </div>
        </div>
    );
}
