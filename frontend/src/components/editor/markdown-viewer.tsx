'use client';

import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeSanitize from 'rehype-sanitize';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownViewerProps {
    source: string;
}

export const MarkdownViewer = ({ source }: MarkdownViewerProps) => {
    return (
        <div className="w-full min-w-0 max-w-full overflow-hidden">
            <MarkdownPreview
                source={source}
                rehypePlugins={[[rehypeSanitize]]}
                className="!bg-transparent text-sm break-words [overflow-wrap:anywhere] [&_pre]:max-w-full [&_pre]:overflow-x-auto
                [&_code]:break-words [&_img]:max-w-full [&_img]:rounded-xl [&_img]:mt-2 prose prose-sm dark:prose-invert
                max-w-none prose-p:my-0 prose-pre:my-2 prose-pre:p-3 prose-a:text-primary
                [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1"
            />
        </div>
    );
};
