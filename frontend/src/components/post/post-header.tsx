'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PostHeader() {
    const router = useRouter();

    return (
        <>
            {/* Header Sticky Bar (Mobile Only - Desktop ẩn vì đã có sidebar) */}
            <div className="sm:hidden sticky top-14 z-40 bg-page/90 backdrop-blur border-b border-default px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-heading transition-colors text-lg font-medium truncate"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
            </div>

            {/* Nút Back Desktop */}
            <div className="hidden sm:block px-6 pt-6 pb-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-heading transition-colors w-fit text-lg font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
        </>
    );
}
