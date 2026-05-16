'use client';

import { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown, RefreshCw, Clock } from 'lucide-react';
import { useSummarizePost } from '@/hooks/ai-hooks/use-post-summary';
import { SummarizePostResponseDTO } from '@/types/ai/post-summary-dto';

const MIN_CONTENT_LENGTH = 300;

type SummaryState = 'idle' | 'loading' | 'success' | 'generating' | 'error' | 'hidden';

interface AiPostSummaryProps {
  postId: string;
  contentLength: number;
  language?: 'vi' | 'en';
}

function formatSeconds(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes <= 1 ? '1 min' : `${minutes} min`;
}

export function AiPostSummary({ postId, contentLength, language = 'vi' }: AiPostSummaryProps) {
  const [summaryState, setSummaryState] = useState<SummaryState>('idle');
  const [summaryData, setSummaryData] = useState<SummarizePostResponseDTO | null>(null);

  const { mutate: summarize, isPending } = useSummarizePost();

  if (contentLength < MIN_CONTENT_LENGTH) return null;

  const handleSummarize = () => {
    if (isPending) return;
    setSummaryState('loading');
    summarize(
      { postId, payload: { language } },
      {
        onSuccess: (data) => {
          if (!data) {
            setSummaryState('error');
            return;
          }

          setSummaryData(data);

          if (data.status === 'Generating') {
            setSummaryState('generating');
            return;
          }

          if (data.status === 'Failed') {
            setSummaryState('error');
            return;
          }

          if (!data.summaryPoints?.length) {
            setSummaryState('error');
            return;
          }

          setSummaryState('success');
        },
        onError: () => {
          setSummaryState('error');
        },
      }
    );
  };

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (summaryState === 'idle') {
    return (
      <div className="flex items-center">
        <button
          id="ai-summarize-btn"
          onClick={handleSummarize}
          className="
            inline-flex items-center gap-2 px-3 py-1.5
            text-xs font-semibold tracking-wide
            text-amber-600 dark:text-amber-400
            border border-amber-300 dark:border-amber-600/50
            rounded-lg bg-amber-50 dark:bg-amber-950/30
            hover:bg-amber-100 dark:hover:bg-amber-900/40
            hover:border-amber-400 dark:hover:border-amber-500
            active:scale-95 transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
          "
          aria-label="Generate AI TL;DR summary for this post"
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden />
          Summarize with AI
        </button>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (summaryState === 'loading') {
    return (
      <div
        className="
          rounded-lg border-l-2 border-amber-400
          bg-amber-50/60 dark:bg-amber-950/20
          border border-amber-200 dark:border-amber-800/40
          px-4 py-3 flex items-center gap-3
        "
        role="status"
        aria-live="polite"
        aria-label="Generating AI summary"
      >
        <span className="relative flex h-5 w-5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" aria-hidden />
          <Sparkles className="relative w-5 h-5 text-amber-500" aria-hidden />
        </span>
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Generating summary...
        </span>
      </div>
    );
  }

  // ── Generating Elsewhere ───────────────────────────────────────────────────
  if (summaryState === 'generating') {
    return (
      <div
        className="
          rounded-lg border-l-2 border-amber-400
          bg-amber-50/60 dark:bg-amber-950/20
          border border-amber-200 dark:border-amber-800/40
          px-4 py-3 flex items-center justify-between gap-3
        "
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {summaryData?.message ?? 'AI summary is being prepared. Please try again shortly.'}
        </span>
        <button
          id="ai-summarize-generating-retry-btn"
          onClick={handleSummarize}
          disabled={isPending}
          aria-disabled={isPending}
          className="
            inline-flex items-center gap-1.5 px-2.5 py-1
            text-xs font-semibold text-amber-700 dark:text-amber-300
            border border-amber-300 dark:border-amber-700
            rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40
            transition-colors active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          <RefreshCw className="w-3 h-3" aria-hidden />
          Try again
        </button>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (summaryState === 'error') {
    return (
      <div
        className="
          rounded-lg border-l-2 border-rose-400
          bg-rose-50/60 dark:bg-rose-950/20
          border border-rose-200 dark:border-rose-800/40
          px-4 py-3 flex items-center justify-between gap-3
        "
        role="alert"
      >
        <span className="text-sm text-rose-600 dark:text-rose-400">
          {summaryData?.message ?? 'Could not generate summary.'}
        </span>
        <button
          id="ai-summarize-retry-btn"
          onClick={handleSummarize}
          className="
            inline-flex items-center gap-1.5 px-2.5 py-1
            text-xs font-semibold text-rose-600 dark:text-rose-400
            border border-rose-300 dark:border-rose-700
            rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40
            transition-colors active:scale-95
          "
        >
          <RefreshCw className="w-3 h-3" aria-hidden />
          Try again
        </button>
      </div>
    );
  }

  // ── Hidden ──────────────────────────────────────────────────────────────────
  if (summaryState === 'hidden') {
    return (
      <div className="flex items-center">
        <button
          id="ai-show-summary-btn"
          onClick={() => setSummaryState('success')}
          className="
            inline-flex items-center gap-2 px-3 py-1.5
            text-xs font-semibold
            text-amber-600 dark:text-amber-400
            border border-amber-300 dark:border-amber-600/50
            rounded-lg bg-amber-50 dark:bg-amber-950/30
            hover:bg-amber-100 dark:hover:bg-amber-900/40
            transition-all duration-150 active:scale-95
          "
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden />
          Show AI summary
        </button>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  return (
    <div
      id="ai-summary-card"
      className="
        rounded-lg border-l-2 border-amber-400
        bg-amber-50/50 dark:bg-amber-950/20
        border border-amber-200 dark:border-amber-800/40
        overflow-hidden
      "
      role="region"
      aria-label="AI-generated post summary"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-200/70 dark:border-amber-800/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
          <span className="text-sm font-bold text-amber-700 dark:text-amber-300">AI Summary</span>
          {summaryData && (
            <span className="flex items-center gap-1 text-xs text-amber-600/70 dark:text-amber-400/70 ml-1">
              <Clock className="w-3 h-3" aria-hidden />
              {formatSeconds(summaryData.originalEstimatedReadTimeSeconds)} read
              <span className="mx-0.5 opacity-50">→</span>
              {formatSeconds(summaryData.summaryEstimatedReadTimeSeconds)} summary
            </span>
          )}
        </div>
        <button
          id="ai-hide-summary-btn"
          onClick={() => setSummaryState('hidden')}
          className="
            p-1 rounded-md text-amber-500/70 hover:text-amber-600
            hover:bg-amber-100 dark:hover:bg-amber-900/40
            transition-colors
          "
          aria-label="Hide AI summary"
        >
          <ChevronUp className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Bullet points */}
      <ul className="px-4 py-3 space-y-2" aria-label="Summary points">
        {summaryData?.summaryPoints.map((point, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-sm text-body leading-relaxed"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
              aria-hidden
            />
            {point}
          </li>
        ))}
      </ul>

      {/* Disclosure */}
      <p className="px-4 pb-3 text-xs text-muted-foreground/70 italic">
        This summary was generated by AI and may not capture every detail.
      </p>
    </div>
  );
}
