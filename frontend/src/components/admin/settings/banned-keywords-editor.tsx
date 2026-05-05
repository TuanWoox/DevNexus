'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
            className="badge-default inline-flex items-center gap-1"
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addKeyword}
          disabled={isSaving || !inputValue.trim()}
        >
          Add
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="custom"
          size="sm"
          className="btn-primary"
          onClick={() => onSave(draft)}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving || !hasChanges}
        >
          Cancel
        </Button>
        {hasChanges && (
          <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
