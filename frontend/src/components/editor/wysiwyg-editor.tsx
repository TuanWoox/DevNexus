'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import {
    Bold, Italic, Code, List, ListOrdered, Quote,
    Heading2, Heading3, Minus, Undo, Redo, ImageIcon
} from 'lucide-react'
import { useRef } from 'react'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const lowlight = createLowlight(all)

interface WysiwygEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    height?: number
}

function ToolbarBtn({
    onClick,
    active,
    tooltip,
    children,
}: {
    onClick: () => void
    active?: boolean
    tooltip: string
    children: React.ReactNode
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors
                        ${active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }
                    `}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
        </Tooltip>
    )
}

export function WysiwygEditor({ value, onChange, placeholder, height = 400 }: WysiwygEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Image.configure({ inline: false, allowBase64: true }),
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: value || '',
        onUpdate({ editor }) {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'outline-none w-full px-1',
            },
        },
    })

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editor) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            editor.chain().focus().setImage({ src: ev.target?.result as string }).run()
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40">
                    <ToolbarBtn tooltip="Undo" onClick={() => editor?.chain().focus().undo().run()}>
                        <Undo className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Redo" onClick={() => editor?.chain().focus().redo().run()}>
                        <Redo className="w-3.5 h-3.5" />
                    </ToolbarBtn>

                    <Separator orientation="vertical" className="h-5 mx-1" />

                    <ToolbarBtn tooltip="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
                        <Bold className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
                        <Italic className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Inline code" active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()}>
                        <Code className="w-3.5 h-3.5" />
                    </ToolbarBtn>

                    <Separator orientation="vertical" className="h-5 mx-1" />

                    <ToolbarBtn tooltip="Heading 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                        <Heading2 className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Heading 3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                        <Heading3 className="w-3.5 h-3.5" />
                    </ToolbarBtn>

                    <Separator orientation="vertical" className="h-5 mx-1" />

                    <ToolbarBtn tooltip="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                        <List className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Ordered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Blockquote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
                        <Quote className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Code block" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
                        <span className="font-mono text-[10px] font-bold leading-none">{'{}'}</span>
                    </ToolbarBtn>
                    <ToolbarBtn tooltip="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                        <Minus className="w-3.5 h-3.5" />
                    </ToolbarBtn>

                    <Separator orientation="vertical" className="h-5 mx-1" />

                    <ToolbarBtn tooltip="Insert image" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Editor */}
                <div
                    className="relative px-4 py-3 bg-background overflow-y-auto cursor-text
                        prose prose-sm max-w-none dark:prose-invert
                        prose-headings:font-semibold prose-headings:text-foreground
                        prose-p:text-foreground/90 prose-p:leading-relaxed
                        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-sm
                        prose-code:bg-muted prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.8em]
                        prose-code:before:content-none prose-code:after:content-none
                        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                        prose-img:rounded-lg prose-img:border prose-img:border-border
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-hr:border-border
                        [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit]"
                    style={{ minHeight: height }}
                    onClick={() => editor?.commands.focus()}
                >
                    {!editor?.getText() && !value && (
                        <p className="absolute top-3 left-4 text-muted-foreground text-sm pointer-events-none select-none">
                            {placeholder || 'Write your content here...'}
                        </p>
                    )}
                    <EditorContent editor={editor} />
                </div>
            </div>
        </TooltipProvider>
    )
}
