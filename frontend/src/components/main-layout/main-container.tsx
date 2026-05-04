'use client'

import { usePathname } from 'next/navigation'
import { LeftSidebar } from './left-sidebar'
import { RightSidebar } from './right-sidebar'
import { MobileHeader } from './mobile-header'

export function MainContainer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isProfilePage = pathname.includes('/profile')

    return (
        <div className="w-full flex">
            {/* CỘT 1: LEFT SIDEBAR */}
            <LeftSidebar />

            {/* CỘT 2: MAIN CONTENT */}
            <div className={`flex-1 min-w-0 max-w-full pb-20 sm:pb-0 flex flex-col z-0 ${!isProfilePage ? 'sm:border-r sm:border-gray-300 dark:sm:border-gray-800 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-[2px_0_15px_-3px_rgba(0,0,0,0.4)]' : ''
                }`}>
                <MobileHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>

            {/* CỘT 3: RIGHT SIDEBAR */}
            {!isProfilePage && <RightSidebar />}
        </div>
    )
}
