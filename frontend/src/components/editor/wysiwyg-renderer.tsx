'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface WysiwygRendererProps {
    html: string
}

export function WysiwygRenderer({ html }: WysiwygRendererProps) {
    const clean = useMemo(() => {
        if (typeof window === 'undefined') return html
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'blockquote', 'hr',
                'img', 'a', 'span', 'div',
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
        })
    }, [html])

    return (
        <div
            className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:text-foreground
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-code:bg-muted prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.8em]
                prose-code:before:content-none prose-code:after:content-none
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:max-w-full
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-hr:border-border
                wrap-break-word"
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    )
}
