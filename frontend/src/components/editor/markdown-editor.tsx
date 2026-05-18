'use client'

import { ChangeEvent, ClipboardEvent, DragEvent, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { MDEditorProps } from '@uiw/react-md-editor'
import type { ICommand } from '@uiw/react-md-editor/commands'
import * as markdownCommands from '@uiw/react-md-editor/commands'
import { Video } from 'lucide-react'
import { ContentType } from '@/types/content-media/content-type'
import { rehypeVideoPlugin } from './rehype-video-plugin'

const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), {
    ssr: false,
    loading: () => <div className="h-32 bg-subtle animate-pulse rounded-md border border-default" />
})

export interface MarkdownEditorHandle {
    getPendingFiles: (content: string) => Map<string, File>;
    cleanup: () => void;
}

interface MarkdownEditorProps extends MDEditorProps {
    contentType?: ContentType;
}

const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_ACCEPT = '.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv';
const editorPreviewSchema = {
    ...defaultSchema,
    protocols: {
        ...defaultSchema.protocols,
        src: [...(defaultSchema.protocols?.src || []), 'blob']
    }
};

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({ contentType, commands, ...props }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const pendingRegistry = useRef<Map<string, File>>(new Map());

    const cleanup = () => {
        pendingRegistry.current.forEach((_, blobUrl) => URL.revokeObjectURL(blobUrl));
        pendingRegistry.current.clear();
    };

    useImperativeHandle(ref, () => ({
        getPendingFiles: (content: string) => {
            const blobUrlRegex = /!\[.*?\]\((blob:[^)]+)\)/g;
            const result = new Map<string, File>();
            let match: RegExpExecArray | null;

            while ((match = blobUrlRegex.exec(content)) !== null) {
                const file = pendingRegistry.current.get(match[1]);
                if (file) result.set(match[1], file);
            }

            return result;
        },
        cleanup
    }));

    useEffect(() => cleanup, []);

    const emitChange = (nextValue: string) => {
        props.onChange?.(nextValue);
    };

    const insertMarkdown = (markdown: string) => {
        const value = String(props.value || '');
        const textarea = wrapperRef.current?.querySelector('textarea');

        if (!textarea) {
            emitChange(value ? `${value}\n${markdown}` : markdown);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        textarea.focus();
        textarea.setSelectionRange(start, end);

        if (document.execCommand('insertText', false, markdown)) {
            return;
        }

        const nextValue = `${value.slice(0, start)}${markdown}${value.slice(end)}`;
        emitChange(nextValue);

        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + markdown.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const registerFile = (file: File, altText = '') => {
        const blobUrl = URL.createObjectURL(file);
        pendingRegistry.current.set(blobUrl, file);
        insertMarkdown(`![${altText}](${blobUrl})`);
    };

    const isSupportedImage = (file: File) => file.type.startsWith('image/') || IMAGE_EXTENSION_REGEX.test(file.name);

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        const files = Array.from(event.clipboardData.files).filter(isSupportedImage);
        if (files.length === 0) return;

        event.preventDefault();
        files.forEach((file) => registerFile(file));
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        const files = Array.from(event.dataTransfer.files).filter(isSupportedImage);
        if (files.length === 0) return;

        event.preventDefault();
        files.forEach((file) => registerFile(file));
    };

    const handleVideoSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        registerFile(file, 'video');
    };

    const editorCommands = useMemo<ICommand[]>(() => {
        const baseCommands = commands || markdownCommands.getCommands();
        if (contentType === undefined) return baseCommands;

        const videoCommand: ICommand = {
            name: 'upload-video',
            keyCommand: 'upload-video',
            buttonProps: { 'aria-label': 'Attach video', title: 'Attach video' },
            render: () => (
                <label className="inline-flex h-full cursor-pointer items-center px-1" title="Attach video">
                    <Video className="h-3.5 w-3.5" />
                    <input
                        type="file"
                        accept={VIDEO_ACCEPT}
                        className="hidden"
                        onChange={handleVideoSelect}
                    />
                </label>
            )
        };

        const imageCommandIndex = baseCommands.findIndex((command) => command.name === 'image' || command.keyCommand === 'image');
        if (imageCommandIndex < 0) return [...baseCommands, videoCommand];

        return [
            ...baseCommands.slice(0, imageCommandIndex + 1),
            videoCommand,
            ...baseCommands.slice(imageCommandIndex + 1)
        ];
    }, [commands, contentType]);

    return (
        <div
            ref={wrapperRef}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            className="relative w-full [&_.w-md-editor]:border-0 [&_.w-md-editor]:bg-transparent [&_.w-md-editor-toolbar]:bg-subtle [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-default [&_.wmde-markdown_ul]:list-disc [&_.wmde-markdown_ul]:ml-5 [&_.wmde-markdown_ol]:list-decimal [&_.wmde-markdown_ol]:ml-5 [&_.wmde-markdown_li]:mb-1 [&_img]:mx-auto [&_img]:max-w-full [&_img]:max-h-[560px] [&_img]:object-contain [&_video]:mx-auto [&_video]:max-w-full [&_video]:max-h-[480px] [&_video]:object-contain [&_video]:rounded-xl [&_video]:mt-3"
        >
            <MDEditor
                previewOptions={{
                    rehypePlugins: [[rehypeSanitize, editorPreviewSchema], rehypeVideoPlugin]
                }}
                minHeight={100}
                height={150}
                preview="edit"
                commands={editorCommands}
                {...props}
            />
        </div>
    )
})

MarkdownEditor.displayName = 'MarkdownEditor'
