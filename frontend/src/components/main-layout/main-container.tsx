'use client'

import { LeftSidebar } from './left-sidebar'
import { MobileHeader } from './mobile-header'
import { RightSidebar } from './right-sidebar'

export function MainContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full flex">
            <LeftSidebar />

            <div className="flex-1 min-w-0 max-w-full pb-20 sm:pb-0 flex flex-col z-0">
                <MobileHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>

            <RightSidebar />
        </div>
    )
}
