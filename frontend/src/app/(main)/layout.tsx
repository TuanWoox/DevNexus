import { LeftSidebar } from '@/components/main-layout/left-sidebar'
import { RightSidebar } from '@/components/main-layout/right-sidebar'
import { MobileHeader } from '@/components/main-layout/mobile-header'
import { MobileNav } from '@/components/main-layout/mobile-nav'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-page text-body flex justify-center">
            <div className="w-full flex px-0 sm:px-4 lg:px-6 2xl:px-8">

                {/* CỘT 1: LEFT SIDEBAR */}
                <LeftSidebar />

                {/* CỘT 2: MAIN CONTENT */}
                <div className="flex-1 min-w-0 max-w-full border-x-0 sm:border-r border-default pb-20 sm:pb-0 flex flex-col">
                    <MobileHeader />
                    <main className="flex-1">
                        {children}
                    </main>
                </div>

                {/* CỘT 3: RIGHT SIDEBAR */}
                <RightSidebar />

            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <MobileNav />

        </div>
    )
}