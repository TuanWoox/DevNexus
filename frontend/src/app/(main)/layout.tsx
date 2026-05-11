import { MobileNav } from '@/components/main-layout/mobile-nav'
import { MainContainer } from '@/components/main-layout/main-container'
import { MessagesGatewayProvider } from '@/components/message/messages-gateway-provider'
import { NotificationGatewayProvider } from '@/components/notification/notification-gateway-provider'

// make sure these are imported if not already
import { LeftSidebar } from '@/components/main-layout/left-sidebar'
import { RightSidebar } from '@/components/main-layout/right-sidebar'
import { MobileHeader } from '@/components/main-layout/mobile-header'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MessagesGatewayProvider>
            <NotificationGatewayProvider>
                <div className="min-h-screen bg-page text-body flex justify-center">

                    <MainContainer>
                        <div className="w-full flex">

                            {/* LEFT SIDEBAR */}
                            <LeftSidebar />

                            {/* MAIN CONTENT */}
                            <div className="flex-1 min-w-0 max-w-full border-x-0 sm:border-r border-default pb-20 sm:pb-0 flex flex-col">
                                <MobileHeader />
                                <main className="flex-1">
                                    {children}
                                </main>
                            </div>

                            {/* RIGHT SIDEBAR */}
                            <RightSidebar />

                        </div>
                    </MainContainer>

                    {/* MOBILE BOTTOM NAV */}
                    <MobileNav />
                </div>
            </NotificationGatewayProvider>
        </MessagesGatewayProvider>
    )
}