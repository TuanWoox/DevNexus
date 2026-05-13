import { Loader2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type NormalizedStatus = 'Pending' | 'InReview' | 'Flagged' | 'Approved';

interface ModerationBannerProps {
    status: NormalizedStatus;
    reason?: string | null;
    className?: string;
}

const config = {
    Pending: {
        wrapper: 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
        title: 'text-blue-700 dark:text-blue-300',
        desc: 'text-blue-600/90 dark:text-blue-400/90',
        icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />,
        label: 'AI is analyzing',
        description: 'Automated checks in progress. Please wait a moment...',
    },
    InReview: {
        wrapper: 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
        title: 'text-amber-700 dark:text-amber-300',
        desc: 'text-amber-600/90 dark:text-amber-400/90',
        icon: <Clock className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />,
        label: 'Pending Admin Review',
        description: 'This post is in the manual moderation queue.',
    },
    Flagged: {
        wrapper: 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
        title: 'text-rose-700 dark:text-rose-300',
        desc: 'text-rose-600/90 dark:text-rose-400/90',
        icon: <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />,
        label: 'Hidden Post',
        description: 'This post requires changes. It is currently only visible to you.',
    },
} as const;

export function ModerationBanner({ status, reason, className }: ModerationBannerProps) {
    if (status === 'Approved') return null;

    const { wrapper, title, desc, icon, label, description } = config[status];

    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-lg border px-3.5 py-3',
                'animate-in fade-in slide-in-from-top-1 duration-300',
                wrapper,
                className,
            )}
            role="status"
            aria-label={label}
        >
            <div className="mt-0.5">{icon}</div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <p className={cn('text-sm font-semibold leading-tight', title)}>{label}</p>
                <p className={cn('text-xs leading-snug', desc)}>{description}</p>
                {reason && (
                    <div className={cn('mt-1.5 text-xs font-medium opacity-100', desc)}>
                        <span className="font-bold">Reason:</span> {reason}
                    </div>
                )}
            </div>
        </div>
    );
}
