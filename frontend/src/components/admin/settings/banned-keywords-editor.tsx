'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface BannedKeywordsEditorProps {
  initialKeywords: string[]
  onSave: (keywords: string[]) => void
  isSaving: boolean
}

type SettingDataType = 'String' | 'Boolean' | 'Number' | 'Json'
type SettingGroup = 'General' | 'Moderation' | 'Security' | 'AI Config'

interface SettingFieldDefinition {
  key: string
  label: string
  description: string
  group: SettingGroup
  dataType: SettingDataType
  renderAs?: 'banned-keywords' | 'switch' | 'text' | 'number' | 'json'
}

export const moderationSettingFields: SettingFieldDefinition[] = [
  {
    key: 'banned_keywords',
    label: 'Banned Keywords',
    description: 'Posts containing these keywords will be held for manual review before publication.',
    group: 'Moderation',
    dataType: 'Json',
    renderAs: 'banned-keywords',
  },
]

export function BannedKeywordsEditor({ initialKeywords, onSave, isSaving }: BannedKeywordsEditorProps) {
  const [draft, setDraft] = useState<string[]>(initialKeywords)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(initialKeywords)
  }, [initialKeywords])

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(initialKeywords)

  function addKeyword() {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return
    if (draft.some((keyword) => keyword.toLowerCase() === trimmed)) {
      setInputValue('')
      return
    }
    setDraft((prev) => [...prev, trimmed])
    setInputValue('')
  }

  function removeKeyword(keyword: string) {
    setDraft((prev) => prev.filter((item) => item !== keyword))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addKeyword()
    }
  }

  return (
    <Card className="card card-hover gap-0 overflow-hidden">
      <CardHeader className="border-b border-border px-6 py-5">
        <CardTitle className="text-base font-semibold text-heading">Banned Keywords</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Posts containing these keywords will be held for manual review before publication.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-6 py-5">
        <div className="flex min-h-20 flex-wrap content-start gap-2 rounded-lg border-default bg-input p-3">
          {draft.length === 0 ? (
            <span className="text-sm text-muted-foreground">No banned keywords configured.</span>
          ) : (
            draft.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="badge-default gap-1.5 rounded-full py-1 pl-2.5 pr-1 font-mono text-xs">
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  disabled={isSaving}
                  className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-white disabled:pointer-events-none disabled:opacity-40"
                  aria-label={`Remove ${keyword}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add keyword..."
            disabled={isSaving}
            className="input max-w-sm"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addKeyword}
            disabled={isSaving || !inputValue.trim()}
            className="btn-ghost"
          >
            Add
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t border-border bg-input/50 px-6 py-4">
        <div className="text-xs text-muted-foreground">
          {hasChanges ? 'Unsaved moderation changes' : 'Changes are saved explicitly.'}
        </div>
        <Button
          type="button"
          onClick={() => onSave(draft)}
          disabled={isSaving || !hasChanges}
          className="btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
