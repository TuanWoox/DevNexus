'use client'

import { forwardRef } from 'react'
import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { MDEditorProps } from '@uiw/react-md-editor'

// Vì thư viện export default, ta trỏ tới .default
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), {
    ssr: false,
    loading: () => <div className="h-32 bg-subtle animate-pulse rounded-md border border-default" />
})

export const MarkdownEditor = forwardRef<HTMLDivElement, MDEditorProps>((props, ref) => {
    // KHÔNG CẦN useTheme hay check mounted nữa. Vì đã xử lý ở ThemeProvider.
    // Dưới đây là code cũ để tham khảo 
    // const { theme, systemTheme } = useTheme();
    // const [mounted, setMounted] = useState(false);

    // useEffect(() => {
    //     setMounted(true);
    // }, []);

    // // Đợi mount để tránh hydration mismatch giữa server color và client color
    // if (!mounted) {
    //     return <div className="h-32 bg-subtle animate-pulse rounded-md border border-default" />;
    // }

    // const currentTheme = theme === 'system' ? systemTheme : theme;
    // const isDark = currentTheme === 'dark';


    return (
        <div
            // KHÔNG CẦN data-color-mode ở đây nữa
            // Dưới đây là code cũ để tham khảo
            // data-color-mode={isDark ? 'dark' : 'light'}
            className="w-full /* Bóp lại styling viền để hệt UI cũ */ [&_.w-md-editor]:border-0 [&_.w-md-editor]:bg-transparent [&_.w-md-editor-toolbar]:bg-subtle [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-default [&_.wmde-markdown_ul]:list-disc [&_.wmde-markdown_ul]:ml-5 [&_.wmde-markdown_ol]:list-decimal [&_.wmde-markdown_ol]:ml-5 [&_.wmde-markdown_li]:mb-1"
        >
            <MDEditor
                ref={ref}
                previewOptions={{
                    rehypePlugins: [[rehypeSanitize]]
                }}
                minHeight={100}
                height={150}
                preview="edit"
                {...props}
            />
        </div>
    )
})

MarkdownEditor.displayName = 'MarkdownEditor'