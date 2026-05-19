'use client';

import { useState } from 'react';
import { Check, Copy, GitBranch, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExplainCode } from '@/hooks/ai-hooks/use-explain-code';
import { useGenerateCodeDiagram } from '@/hooks/ai-hooks/use-generate-code-diagram';
import {
    CodeToolContext,
    DiagramType,
    ExplainCodeResponseDTO,
    GenerateCodeDiagramResponseDTO,
} from '@/types/ai/code-tools-dto';
import { CodeExplainPanel } from './code-explain-panel';
import { CodeDiagramPanel } from './code-diagram-panel';

interface MarkdownCodeBlockProps {
    code: string;
    language?: string;
    enableCodeTools?: boolean;
    context?: CodeToolContext;
    postId?: string;
}

type ActiveTool = 'explain' | 'diagram' | null;

function getDisplayLanguage(language?: string) {
    return language?.trim() ? language.trim() : 'Auto';
}

export function MarkdownCodeBlock({
    code,
    language,
    enableCodeTools = false,
    context,
    postId,
}: MarkdownCodeBlockProps) {
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);
    const [copied, setCopied] = useState(false);
    const [explainResult, setExplainResult] = useState<ExplainCodeResponseDTO | null>(null);
    const [explainError, setExplainError] = useState<string | null>(null);
    const [diagramType, setDiagramType] = useState<DiagramType>('auto');
    const [diagramResult, setDiagramResult] = useState<GenerateCodeDiagramResponseDTO | null>(null);
    const [diagramError, setDiagramError] = useState<string | null>(null);

    const explainMutation = useExplainCode();
    const diagramMutation = useGenerateCodeDiagram();
    const canUseAiTools = enableCodeTools === true && context === 'post-detail';
    const normalizedLanguage = language?.trim() || 'auto';

    const copyText = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(label);
        } catch {
            toast.error('Could not copy to clipboard.');
        }
    };

    const handleCopyCode = async () => {
        await copyText(code, 'Code copied.');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    const requestExplanation = () => {
        setExplainError(null);
        explainMutation.mutate(
            { code, language: normalizedLanguage, postId },
            {
                onSuccess: (data) => {
                    if (!data) {
                        setExplainError('Could not explain this code.');
                        return;
                    }

                    setExplainResult(data);
                },
                onError: () => {
                    setExplainError('Could not explain this code.');
                },
            }
        );
    };

    const handleExplain = () => {
        setActiveTool((current) => (current === 'explain' ? null : 'explain'));
        if (explainResult || explainMutation.isPending) return;
        requestExplanation();
    };

    const handleGenerateDiagram = () => {
        setDiagramError(null);
        diagramMutation.mutate(
            { code, language: normalizedLanguage, diagramType, postId },
            {
                onSuccess: (data) => {
                    if (!data?.mermaidCode) {
                        setDiagramError('Could not generate a diagram for this code.');
                        return;
                    }

                    setDiagramResult(data);
                },
                onError: () => {
                    setDiagramError('Could not generate a diagram for this code.');
                },
            }
        );
    };

    const handleDiagram = () => {
        setActiveTool((current) => (current === 'diagram' ? null : 'diagram'));
        if (diagramResult || diagramMutation.isPending) return;
        handleGenerateDiagram();
    };

    return (
        <div className="my-3 overflow-hidden rounded-lg border border-default bg-subtle">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-page px-3 py-2">
                <span className="rounded-md border border-default bg-subtle px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {getDisplayLanguage(language)}
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1.5 rounded-md border border-default px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-subtle hover:text-heading"
                    >
                        {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
                        Copy
                    </button>
                    {canUseAiTools && (
                        <>
                            <button
                                type="button"
                                onClick={handleExplain}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                                    activeTool === 'explain'
                                        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
                                        : 'border-default text-muted-foreground hover:bg-subtle hover:text-heading'
                                }`}
                            >
                                <Sparkles className="h-3 w-3" aria-hidden />
                                Explain
                            </button>
                            <button
                                type="button"
                                onClick={handleDiagram}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                                    activeTool === 'diagram'
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'
                                        : 'border-default text-muted-foreground hover:bg-subtle hover:text-heading'
                                }`}
                            >
                                <GitBranch className="h-3 w-3" aria-hidden />
                                Diagram
                            </button>
                            {activeTool && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTool(null)}
                                    className="rounded-md border border-default p-1 text-muted-foreground hover:bg-subtle hover:text-heading"
                                    aria-label="Close code tool panel"
                                >
                                    <X className="h-3.5 w-3.5" aria-hidden />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <pre className="m-0 max-w-full overflow-x-auto bg-transparent p-3 text-sm leading-relaxed">
                <code className={language ? `language-${language}` : undefined}>{code}</code>
            </pre>

            {activeTool === 'explain' && (
                <CodeExplainPanel
                    result={explainResult}
                    isLoading={explainMutation.isPending}
                    errorMessage={explainError}
                    onRetry={requestExplanation}
                />
            )}

            {activeTool === 'diagram' && (
                <CodeDiagramPanel
                    selectedDiagramType={diagramType}
                    onDiagramTypeChange={(nextType) => {
                        setDiagramType(nextType);
                        setDiagramResult(null);
                        setDiagramError(null);
                    }}
                    result={diagramResult}
                    isLoading={diagramMutation.isPending}
                    errorMessage={diagramError}
                    onGenerate={handleGenerateDiagram}
                    onCopyMermaid={() => {
                        if (diagramResult?.mermaidCode) {
                            copyText(diagramResult.mermaidCode, 'Mermaid source copied.');
                        }
                    }}
                />
            )}
        </div>
    );
}
