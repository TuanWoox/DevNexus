'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';

interface BannedKeywordsEditorProps {
  initialKeywords: string[];
  onSave: (keywords: string[]) => void;
  isSaving: boolean;
}

export function BannedKeywordsEditor({ initialKeywords, onSave, isSaving }: BannedKeywordsEditorProps) {
  const [draft, setDraft] = useState<string[]>(initialKeywords);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setDraft(initialKeywords);
  }, [initialKeywords]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(initialKeywords);

  function addKeyword() {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return;
    if (draft.some((k) => k.toLowerCase() === trimmed)) {
      setInputValue('');
      return;
    }
    setDraft((prev) => [...prev, trimmed]);
    setInputValue('');
  }

  function removeKeyword(keyword: string) {
    setDraft((prev) => prev.filter((k) => k !== keyword));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  }

  function handleCancel() {
    setDraft(initialKeywords);
    setInputValue('');
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-heading">Banned Keywords</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Posts containing these keywords will be held for manual review.
        </p>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        {draft.length === 0 && (
          <span className="text-sm text-muted-foreground italic">No banned keywords.</span>
        )}
        {draft.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
          >
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              disabled={isSaving}
              className="ml-1 rounded-full hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={`Remove ${keyword}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add input */}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add keyword…"
          disabled={isSaving}
          className="max-w-xs"
        />
        <button
          type="button"
          onClick={addKeyword}
          disabled={isSaving || !inputValue.trim()}
          className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={isSaving || !hasChanges}
          className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving || !hasChanges}
          className="rounded-md border border-default px-4 py-1.5 text-xs font-semibold hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        {hasChanges && (
          <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
