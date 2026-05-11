import { MobileNav } from '@/components/main-layout/mobile-nav'
import { MainContainer } from '@/components/main-layout/main-container'
import { MessagesGatewayProvider } from '@/components/message/messages-gateway-provider'
import { NotificationGatewayProvider } from '@/components/notification/notification-gateway-provider'

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
                        {children}
                    </MainContainer>

                    {/* MOBILE BOTTOM NAV */}
                    <MobileNav />
                </div>
            </NotificationGatewayProvider>
        </MessagesGatewayProvider>
    )
}