'use client';

import { useState, useRef } from 'react';
import {
    Bold,
    Italic,
    Link,
    MoreHorizontal,
    Type
} from 'lucide-react';

interface CommentInputProps {
    postId: string;
    currentUserAvatar?: string;
}

export function CommentInput({ postId, currentUserAvatar }: CommentInputProps) {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (!content.trim()) return;
        // Thực hiện logic gọi API submit comment ở đây
        console.log('Submitting to postId:', postId, 'Content:', content);

        // Reset sau khi gửi
        setContent('');
        setIsExpanded(false);
    };

    const handleCancel = () => {
        setContent('');
        setIsExpanded(false);
    };

    return (
        <div className="flex gap-3 sm:gap-4 mb-8">
            {/* Avatar */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 shrink-0 mt-1 border border-default overflow-hidden">
                {currentUserAvatar ? (
                    <img src={currentUserAvatar} alt="Current User" className="w-full h-full object-cover" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center font-bold text-primary">U</span>
                )}
            </div>

            {/* Input Container */}
            <div className="flex-1">
                {/* Bọc toàn bộ trong 1 div có viền (border) để tạo cảm giác nguyên khối.
                    Dùng focus-within để khi bấm vào textarea, toàn bộ khung này sẽ sáng lên (ring-primary)
                */}
                <div
                    className={`bg-subtle border rounded-xl overflow-hidden transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary flex flex-col ${isExpanded ? 'border-primary' : 'border-default'
                        }`}
                >
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        placeholder="What are your thoughts?"
                        /* Loại bỏ bg và outline của textarea mặc định.
                           Cho phép resize dọc, và thay đổi min-height dựa vào state
                        */
                        className={`w-full bg-transparent p-3 sm:p-4 text-sm sm:text-base text-heading placeholder:text-muted-foreground focus:outline-none resize-y transition-all duration-200 ${isExpanded ? 'min-h-30' : 'min-h-12.5 overflow-hidden'
                            }`}
                    />

                    {/* Bottom Action Bar (Giống Reddit) - Chỉ hiện khi Focus hoặc đang có chữ */}
                    {(isExpanded || content.trim().length > 0) && (
                        <div className="flex items-center justify-between px-2 py-2 sm:px-3 bg-subtle mt-auto">

                            {/* Toolbar (Bên trái) */}
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 sm:p-2 text-muted-foreground hover:bg-secondary hover:text-heading rounded-lg transition-colors" title="Formatting options">
                                    <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                {/* Một số icon giả lập Markdown Editor như ảnh của bạn */}
                                <div className="hidden sm:flex items-center gap-1 border-l border-default pl-1 ml-1">
                                    <button className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-heading rounded-lg transition-colors">
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-heading rounded-lg transition-colors">
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-heading rounded-lg transition-colors">
                                        <Link className="w-4 h-4" />
                                    </button>
                                </div>

                                <button className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-heading rounded-lg transition-colors sm:hidden">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Buttons (Bên phải) */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="btn-ghost px-4 py-1.5 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!content.trim()}
                                    /* Bo tròn mạnh (rounded-full) theo UI của Reddit */
                                    className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5  text-sm font-semibold "
                                >
                                    Comment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}