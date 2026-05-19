'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import { ExplainCodeResponseDTO } from '@/types/ai/code-tools-dto';

interface CodeExplainPanelProps {
    result: ExplainCodeResponseDTO | null;
    isLoading: boolean;
    errorMessage?: string | null;
    onRetry: () => void;
}

function SectionList({ title, items }: { title: string; items?: string[] }) {
    if (!items?.length) return null;

    return (
        <section className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">{title}</h4>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={`${title}-${index}`} className="text-sm leading-relaxed text-body">
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function CodeExplainPanel({
    result,
    isLoading,
    errorMessage,
    onRetry,
}: CodeExplainPanelProps) {
    if (isLoading) {
        return (
            <div className="border-t border-default bg-amber-50/50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                    <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                    Explaining code...
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="flex items-center justify-between gap-3 border-t border-default bg-rose-50/60 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                <span>{errorMessage}</span>
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold hover:bg-rose-100 dark:border-rose-700 dark:hover:bg-rose-900/30"
                >
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    Retry
                </button>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="space-y-4 border-t border-default bg-page px-4 py-4">
            <section className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-heading">AI Explanation</h3>
                    {result.complexityRating && (
                        <span className="rounded-md border border-default bg-subtle px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {result.complexityRating}
                        </span>
                    )}
                </div>
                <p className="text-sm leading-relaxed text-body">{result.purpose}</p>
            </section>

            <SectionList title="How it works" items={result.howItWorks} />
            <SectionList title="Important details" items={result.importantDetails} />
            <SectionList title="Potential issues" items={result.potentialIssues} />
            <SectionList title="Suggested improvements" items={result.suggestedImprovements} />

            {result.concepts?.length ? (
                <div className="flex flex-wrap gap-1.5">
                    {result.concepts.map((concept) => (
                        <span
                            key={concept}
                            className="rounded-md border border-default bg-subtle px-2 py-0.5 text-xs text-muted-foreground"
                        >
                            {concept}
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
