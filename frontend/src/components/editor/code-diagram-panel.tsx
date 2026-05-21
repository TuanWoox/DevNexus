'use client';

import { Copy, RefreshCw, Sparkles } from 'lucide-react';
import {
    DiagramType,
    GenerateCodeDiagramResponseDTO,
} from '@/types/ai/code-tools-dto';
import { MermaidPreview } from './mermaid-preview';

interface CodeDiagramPanelProps {
    selectedDiagramType: DiagramType;
    onDiagramTypeChange: (diagramType: DiagramType) => void;
    result: GenerateCodeDiagramResponseDTO | null;
    isLoading: boolean;
    errorMessage?: string | null;
    onGenerate: () => void;
    onCopyMermaid: () => void;
}

const diagramOptions: Array<{ value: DiagramType; label: string }> = [
    { value: 'auto', label: 'Auto' },
    { value: 'flowchart', label: 'Flowchart' },
    { value: 'sequence', label: 'Sequence' },
];

export function CodeDiagramPanel({
    selectedDiagramType,
    onDiagramTypeChange,
    result,
    isLoading,
    errorMessage,
    onGenerate,
    onCopyMermaid,
}: CodeDiagramPanelProps) {
    return (
        <div className="space-y-3 border-t border-default bg-page px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-md border border-default bg-subtle p-0.5">
                    {diagramOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onDiagramTypeChange(option.value)}
                            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                                selectedDiagramType === option.value
                                    ? 'bg-page text-heading shadow-sm'
                                    : 'text-muted-foreground hover:text-heading'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                >
                    {isLoading ? (
                        <Sparkles className="h-3 w-3 animate-pulse" aria-hidden />
                    ) : (
                        <RefreshCw className="h-3 w-3" aria-hidden />
                    )}
                    {result ? 'Regenerate' : 'Generate'}
                </button>
            </div>

            {errorMessage && (
                <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                    {errorMessage}
                </div>
            )}

            {isLoading && !result && (
                <div className="rounded-md border border-default bg-subtle px-3 py-2 text-sm text-muted-foreground">
                    Generating diagram...
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-heading">
                            Mermaid {result.diagramType === 'sequence' ? 'Sequence' : 'Flowchart'}
                        </h3>
                        <button
                            type="button"
                            onClick={onCopyMermaid}
                            className="inline-flex items-center gap-1.5 rounded-md border border-default px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-subtle hover:text-heading"
                        >
                            <Copy className="h-3 w-3" aria-hidden />
                            Copy Mermaid
                        </button>
                    </div>
                    <MermaidPreview code={result.mermaidCode} />
                    <pre className="max-h-72 overflow-auto rounded-md border border-default bg-subtle p-3 text-xs text-body">
                        <code>{result.mermaidCode}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
