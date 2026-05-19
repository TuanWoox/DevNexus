'use client';

import { Copy, RefreshCw, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DiagramType,
    GenerateCodeDiagramResponseDTO,
} from '@/types/ai/code-tools-dto';
import { MermaidPreview } from './mermaid-preview';

interface CodeDiagramDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDiagramType: DiagramType;
    onDiagramTypeChange: (diagramType: DiagramType) => void;
    result: GenerateCodeDiagramResponseDTO | null;
    isLoading: boolean;
    errorMessage?: string | null;
    onGenerate: () => void;
    onRegenerate: () => void;
    onCopyMermaid: () => void;
}

const diagramOptions: Array<{ value: DiagramType; label: string }> = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'flowchart', label: 'Flowchart' },
    { value: 'sequence', label: 'Sequence' },
];

export function CodeDiagramDialog({
    open,
    onOpenChange,
    selectedDiagramType,
    onDiagramTypeChange,
    result,
    isLoading,
    errorMessage,
    onGenerate,
    onRegenerate,
    onCopyMermaid,
}: CodeDiagramDialogProps) {
    const hasSource = Boolean(result?.mermaidCode);
    const mermaidSource = result?.mermaidCode ?? '';
    const isGenerating = result?.status === 'Generating';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[80vh] min-h-0 flex-col gap-3 p-4 sm:max-w-6xl">
                <DialogHeader className="pr-8">
                    <DialogTitle>Code Diagram</DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default pb-3">
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

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCopyMermaid}
                            disabled={!hasSource}
                            className="inline-flex items-center gap-1.5 rounded-md border border-default px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-subtle hover:text-heading disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Copy className="h-3 w-3" aria-hidden />
                            Copy Mermaid
                        </button>
                        <button
                            type="button"
                            onClick={result ? onRegenerate : onGenerate}
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
                </div>

                {errorMessage && (
                    <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                        {errorMessage}
                    </div>
                )}

                {isGenerating && (
                    <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-700 dark:bg-sky-950/20 dark:text-sky-300">
                        {result?.message || 'AI is already generating this diagram. Please try again in a few seconds.'}
                    </div>
                )}

                {isLoading && !result && (
                    <div className="rounded-md border border-default bg-subtle px-3 py-2 text-sm text-muted-foreground">
                        Generating diagram...
                    </div>
                )}

                <Tabs defaultValue="preview" className="min-h-0 flex-1">
                    <TabsList className="h-8">
                        <TabsTrigger value="preview" className="text-xs">
                            Preview
                        </TabsTrigger>
                        <TabsTrigger value="source" className="text-xs">
                            Source
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="m-0 min-h-0 overflow-auto">
                        {hasSource ? (
                            <MermaidPreview code={mermaidSource} className="max-h-full" />
                        ) : (
                            <div className="rounded-md border border-default bg-subtle px-3 py-2 text-sm text-muted-foreground">
                                Generate a diagram to preview it here.
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="source" className="m-0 min-h-0 overflow-auto">
                        <pre className="min-h-40 overflow-auto rounded-md border border-default bg-subtle p-3 text-xs text-body">
                            <code>{mermaidSource || 'No Mermaid source yet.'}</code>
                        </pre>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
