'use client'

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface EditableTagChipsProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    disabled?: boolean;
}

const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-');

export const normalizeSuggestedTags = (tags: string[], maxTags = 5) => {
    const seen = new Set<string>();

    return tags.reduce<string[]>((acc, tag) => {
        const normalizedTag = normalizeTag(tag);

        if (!normalizedTag || seen.has(normalizedTag) || acc.length >= maxTags) {
            return acc;
        }

        seen.add(normalizedTag);
        acc.push(normalizedTag);
        return acc;
    }, []);
};

export function EditableTagChips({
    tags,
    onChange,
    maxTags = 5,
    disabled = false,
}: EditableTagChipsProps) {
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();

        const normalizedTag = normalizeTag(tagInput);
        if (!normalizedTag || tags.includes(normalizedTag) || tags.length >= maxTags) {
            setTagInput('');
            return;
        }

        onChange([...tags, normalizedTag]);
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="p-2 min-h-11 border-2 border-default input bg-page flex flex-wrap gap-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all items-center">
            {tags.map((tag) => (
                <span key={tag} className="badge-emerald animate-scale-in">
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-200 transition-colors"
                        disabled={disabled}
                        aria-label={`Remove ${tag}`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none min-w-30 text-sm text-heading placeholder:text-muted-foreground px-2"
                placeholder={tags.length < maxTags ? "Type and press Enter..." : "Max tags reached"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={disabled || tags.length >= maxTags}
            />
        </div>
    );
}
