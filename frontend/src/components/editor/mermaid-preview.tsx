'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface MermaidPreviewProps {
    code: string;
    className?: string;
}

export function MermaidPreview({ code, className }: MermaidPreviewProps) {
    const reactId = useId();
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const renderDiagram = async () => {
            if (!code.trim()) {
                setSvg('');
                setError(null);
                return;
            }

            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme: 'neutral',
                });

                const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
                const rendered = await mermaid.render(diagramId, code);

                if (!cancelled) {
                    setSvg(rendered.svg);
                    setError(null);
                }
            } catch {
                if (!cancelled) {
                    setSvg('');
                    setError('Diagram preview is unavailable for this Mermaid syntax.');
                }
            }
        };

        renderDiagram();

        return () => {
            cancelled = true;
        };
    }, [code, reactId]);

    if (error) {
        return (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                {error}
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="rounded-md border border-default bg-subtle px-3 py-2 text-sm text-muted-foreground">
                Rendering diagram...
            </div>
        );
    }

    return (
        <div
            className={cn(
                "overflow-auto rounded-md border border-default bg-white p-3 text-slate-900 dark:bg-slate-100",
                className
            )}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
