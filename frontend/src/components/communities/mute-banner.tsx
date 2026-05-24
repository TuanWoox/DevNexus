import { MegaphoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuteBannerProps {
    mutedUntil?: string | null;
    muteReason?: string | null;
    className?: string;
}

export function MuteBanner({ mutedUntil, muteReason, className }: MuteBannerProps) {
    const untilText = mutedUntil
        ? new Date(mutedUntil).toLocaleString()
        : "further notice";

    return (
        <div
            className={cn(
                "mx-auto my-4 flex w-full max-w-6xl items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
                className
            )}
            role="status"
        >
            <MegaphoneOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">You are muted in this community until {untilText}.</p>
                {muteReason && (
                    <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                        Reason: {muteReason}
                    </p>
                )}
            </div>
        </div>
    );
}
