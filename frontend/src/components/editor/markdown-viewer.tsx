'use client'

import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'
import '@uiw/react-markdown-preview/markdown.css'

// Thay vì load cả cái Editor khổng lồ, ta chỉ cần gọi component Preview của thư viện ra để đảm bảo tốc độ.
const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview').then((mod) => mod.default), {
    ssr: false,
    loading: () => <div className="h-16 bg-subtle animate-pulse rounded-md w-full" />
})

interface MarkdownViewerProps {
    source: string;
}

// Xử lí phần theme và lỗi hydration mismatch như markdown-editor
export const MarkdownViewer = ({ source }: MarkdownViewerProps) => {

    return (
        <div className="w-full">
            <MarkdownPreview
                source={source}
                rehypePlugins={[[rehypeSanitize]]} // 3. Rất quan trọng! Xoá sổ thẻ <script> nếu hacker chèn vào Post/Comment
                /* 
                   4. STYLE FIX VỠ GIAO DIỆN:
                   - !bg-transparent: Xoá màu nền mặc định của UIW để nó "chìm" vào màu card comment
                   - break-words: Ép các text dài ngoằng (như chuỗi Link mã hoá) tự động xuống dòng
                   - [&_pre]:overflow-x-auto: Nếu user gửi CodeBlock, bắt nó cuộn ngang bên trong chứ không được phá vỡ khung comment cha
                   - [&_img]:max-w-full [&_img]:rounded-md: Ép hình ảnh không được bự hơn khung cha, và đẹp hơn nhờ bo góc
                   - prose prose-sm: Giữ lại chuẩn Typo của Tailwind
                */
                className="!bg-transparent text-sm sm:text-base break-words [&_pre]:overflow-x-auto 
                [&_img]:max-w-full [&_img]:rounded-xl [&_img]:mt-2 prose prose-sm dark:prose-invert 
                max-w-none prose-p:my-0 prose-pre:my-2 prose-pre:p-3 prose-a:text-primary 
                [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1"
            />
        </div>
    )
}
