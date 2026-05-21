'use client';

import { isValidElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import '@uiw/react-markdown-preview/markdown.css';
import { rehypeVideoPlugin } from './rehype-video-plugin';
import { MarkdownCodeBlock } from './markdown-code-block';
import { CodeToolContext } from '@/types/ai/code-tools-dto';

interface MarkdownViewerProps {
    source: string;
    enableCodeTools?: boolean;
    context?: CodeToolContext;
    postId?: string;
}

interface CodeChildProps {
    className?: string;
    children?: ReactNode;
}

function getTextFromNode(node: ReactNode): string {
    if (Array.isArray(node)) {
        return node.map(getTextFromNode).join('');
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    return '';
}

function getLanguage(className?: string): string | undefined {
    const prefix = 'language-';
    const classNames = className?.split(' ') ?? [];
    const languageClass = classNames.find((name) => name.startsWith(prefix));
    return languageClass?.slice(prefix.length);
}

function trimTrailingNewline(value: string): string {
    if (value.endsWith('\r\n')) return value.slice(0, -2);
    if (value.endsWith('\n')) return value.slice(0, -1);
    return value;
}

export const MarkdownViewer = ({
    source,
    enableCodeTools = false,
    context,
    postId,
}: MarkdownViewerProps) => {
    return (
        <div className="w-full min-w-0 max-w-full overflow-hidden !bg-transparent text-sm break-words [overflow-wrap:anywhere] [&_pre]:max-w-full [&_pre]:overflow-x-auto
                [&_code]:break-words [&_img]:mx-auto [&_img]:max-w-full [&_img]:max-h-[560px] [&_img]:object-contain [&_img]:rounded-xl [&_img]:mt-2 prose prose-sm dark:prose-invert
                [&_video]:mx-auto [&_video]:max-w-full [&_video]:max-h-[480px] [&_video]:object-contain [&_video]:rounded-xl [&_video]:mt-3 max-w-none prose-p:my-0 prose-pre:my-2 prose-pre:p-3 prose-a:text-primary
                [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeSanitize], rehypeVideoPlugin]}
                components={{
                    pre({ children }) {
                        if (!isValidElement<CodeChildProps>(children)) {
                            return <pre>{children}</pre>;
                        }

                        const codeProps = children.props;
                        const code = trimTrailingNewline(getTextFromNode(codeProps.children));
                        const language = getLanguage(codeProps.className);

                        return (
                            <MarkdownCodeBlock
                                code={code}
                                language={language}
                                enableCodeTools={enableCodeTools}
                                context={context}
                                postId={postId}
                            />
                        );
                    },
                    code({ className, children, node, ...props }) {
                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {source}
            </ReactMarkdown>
        </div>
    );
};
