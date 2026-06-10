'use client'

import { LeftSidebar } from './left-sidebar'
import { MobileHeader } from './mobile-header'
import { RightSidebar } from './right-sidebar'
import { usePathname } from 'next/navigation'

const RIGHT_SIDEBAR_EXACT_ROUTES = ["/feed", "/questions", "/communities"];

// const RIGHT_SIDEBAR_DETAIL_PATTERNS = [
//     /^\/post\/[^/]+$/,
//     /^\/questions\/[^/]+$/,
//     /^\/communities\/[^/]+$/,
// ];

function shouldShowRightSidebar(pathname: string | null) {
    if (!pathname) return false;

    return RIGHT_SIDEBAR_EXACT_ROUTES.includes(pathname);
    // || RIGHT_SIDEBAR_DETAIL_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function MainContainer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showRightSidebar = shouldShowRightSidebar(pathname);

    return (
        <div className="w-full flex">
            <LeftSidebar />

            <div className="flex-1 min-w-0 max-w-full pb-20 sm:pb-0 flex flex-col z-0">
                <MobileHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>

            {showRightSidebar && <RightSidebar />}
        </div>
    )
}
