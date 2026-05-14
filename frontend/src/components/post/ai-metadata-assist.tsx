'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Check, RefreshCw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSuggestContentMetadata } from '@/hooks/ai-hooks/use-suggest-content-metadata'
import { useUpdateAiUsageInteraction } from '@/hooks/ai-hooks/use-update-ai-usage-interaction'
import { EditableTagChips, normalizeSuggestedTags } from './editable-tag-chips'

type AiMetadataStatus = 'idle' | 'generating' | 'available' | 'error';

interface AiMetadataAssistProps {
    content: string;
    currentTitle: string;
    currentTags: string[];
    isSubmitting: boolean;
    onApply: (suggestion: { title: string; tags: string[] }) => void;
}

const MIN_CONTENT_LENGTH = 300;

const getContentKey = (content: string) => content.trim();

export function AiMetadataAssist({
    content,
    currentTitle,
    currentTags,
    isSubmitting,
    onApply,
}: AiMetadataAssistProps) {
    const [status, setStatus] = useState<AiMetadataStatus>('idle');
    const [suggestedTitle, setSuggestedTitle] = useState('');
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [generatedContentKey, setGeneratedContentKey] = useState<string | null>(null);
    const [dismissedContentKey, setDismissedContentKey] = useState<string | null>(null);
    const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);
    const [usageLogId, setUsageLogId] = useState<number | null>(null);
    const latestRequestIdRef = useRef(0);

    const suggestMetadata = useSuggestContentMetadata();
    const updateUsageInteraction = useUpdateAiUsageInteraction();
    const contentKey = getContentKey(content);
    const isContentLongEnough = contentKey.length >= MIN_CONTENT_LENGTH;
    const isDismissedForCurrentContent = dismissedContentKey === contentKey;
    const hasExistingMetadata = currentTitle.trim().length > 0 || currentTags.length > 0;
    const isStale = status === 'available' && generatedContentKey !== null && generatedContentKey !== contentKey;
    const shouldShowCta =
        isContentLongEnough &&
        status === 'idle' &&
        !isDismissedForCurrentContent &&
        !isSubmitting;
    const shouldShowPanel = status === 'generating' || status === 'available' || status === 'error';

    const handleGenerate = () => {
        if (!isContentLongEnough || status === 'generating') {
            return;
        }

        const requestContentKey = contentKey;
        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;
        setStatus('generating');
        setErrorMessage(null);
        setShowReplaceConfirmation(false);
        setUsageLogId(null);

        suggestMetadata.mutate(
            { markdown_content: requestContentKey },
            {
                onSuccess: (response) => {
                    if (latestRequestIdRef.current !== requestId) {
                        return;
                    }

                    const normalizedTags = normalizeSuggestedTags(response.suggested_tags ?? []);
                    if (!response.suggested_title?.trim() && normalizedTags.length === 0) {
                        setStatus('error');
                        setErrorMessage("AI returned an empty suggestion. Try again after adding more detail.");
                        return;
                    }

                    setSuggestedTitle(response.suggested_title?.trim() ?? '');
                    setSuggestedTags(normalizedTags);
                    setUsageLogId(response.usage_log_id ?? null);
                    setGeneratedContentKey(requestContentKey);
                    setDismissedContentKey(null);
                    setStatus('available');
                },
                onError: () => {
                    if (latestRequestIdRef.current !== requestId) {
                        return;
                    }

                    setStatus('error');
                    setErrorMessage("We couldn't generate suggestions right now.");
                },
            }
        );
    };

    const trackInteraction = (
        interactionStatus: 'applied' | 'dismissed',
        metadataJsonPatch?: Record<string, boolean>
    ) => {
        if (!usageLogId) {
            return;
        }

        updateUsageInteraction.mutate(
            {
                usageLogId,
                payload: {
                    interaction_status: interactionStatus,
                    metadata_json_patch: metadataJsonPatch,
                },
            },
            {
                onError: (error) => {
                    console.warn('Failed to update AI usage interaction.', error);
                },
            }
        );
    };

    const handleDismiss = () => {
        const dismissedUsageLogId = usageLogId;
        setStatus('idle');
        setSuggestedTitle('');
        setSuggestedTags([]);
        setErrorMessage(null);
        setGeneratedContentKey(null);
        setDismissedContentKey(contentKey);
        setShowReplaceConfirmation(false);
        setUsageLogId(null);

        if (dismissedUsageLogId) {
            updateUsageInteraction.mutate(
                {
                    usageLogId: dismissedUsageLogId,
                    payload: {
                        interaction_status: 'dismissed',
                    },
                },
                {
                    onError: (error) => {
                        console.warn('Failed to update AI usage interaction.', error);
                    },
                }
            );
        }
    };

    const applySuggestion = () => {
        const replacedExistingTitle = currentTitle.trim().length > 0;
        const replacedExistingTags = currentTags.length > 0;

        onApply({
            title: suggestedTitle.trim(),
            tags: normalizeSuggestedTags(suggestedTags),
        });
        setShowReplaceConfirmation(false);
        trackInteraction('applied', {
            replacedExistingTitle,
            replacedExistingTags,
        });
    };

    const handleApply = () => {
        if (hasExistingMetadata && !showReplaceConfirmation) {
            setShowReplaceConfirmation(true);
            return;
        }

        applySuggestion();
    };

    if (!shouldShowCta && !shouldShowPanel) {
        return null;
    }

    return (
        <div className="rounded-lg border border-emerald-500/30 bg-card p-4 shadow-ai-md space-y-4">
            {shouldShowCta && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-heading">Need help naming this post?</h3>
                            <p className="text-sm text-muted-foreground">
                                Generate editable title and tag suggestions from your body content.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="custom"
                        className="btn-ai text-white h-9 px-4 gap-2"
                        onClick={handleGenerate}
                    >
                        <Sparkles className="w-4 h-4" />
                        Suggest title & tags
                    </Button>
                </div>
            )}

            {status === 'generating' && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    Generating suggestions...
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-3">
                    <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errorMessage}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="custom"
                            className="btn-ai text-white h-8 px-3 gap-2"
                            onClick={handleGenerate}
                            disabled={isSubmitting}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3 gap-2"
                            onClick={handleDismiss}
                        >
                            <X className="w-4 h-4" />
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}

            {status === 'available' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-semibold text-heading">AI Suggestions</h3>
                    </div>

                    {isStale && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Your body changed after these suggestions were generated. Regenerate for updated suggestions.
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="ai-suggested-title" className="text-sm font-semibold text-heading">
                            Suggested title
                        </Label>
                        <Input
                            id="ai-suggested-title"
                            value={suggestedTitle}
                            onChange={(e) => setSuggestedTitle(e.target.value)}
                            className="bg-page border-2"
                            maxLength={500}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-heading">
                            Suggested tags
                        </Label>
                        <EditableTagChips tags={suggestedTags} onChange={setSuggestedTags} />
                    </div>

                    {showReplaceConfirmation && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                            Applying will replace your current title and tags. Your body content will not change.
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="custom"
                            className="btn-ai text-white h-8 px-3 gap-2"
                            onClick={handleApply}
                            disabled={!suggestedTitle.trim() && suggestedTags.length === 0}
                        >
                            <Check className="w-4 h-4" />
                            {showReplaceConfirmation ? 'Replace current metadata' : 'Apply suggestions'}
                        </Button>
                        {showReplaceConfirmation && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-3"
                                onClick={() => setShowReplaceConfirmation(false)}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3 gap-2"
                            onClick={handleGenerate}
                            disabled={isSubmitting}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-3 gap-2"
                            onClick={handleDismiss}
                        >
                            <X className="w-4 h-4" />
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
