import { MobileNav } from '@/components/main-layout/mobile-nav'
import { MainContainer } from '@/components/main-layout/main-container'
import { MessagesGatewayProvider } from '@/components/message/messages-gateway-provider'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MessagesGatewayProvider>
            <div className="min-h-screen bg-page text-body flex justify-center">
                <MainContainer>
                    {children}
                </MainContainer>

                {/* MOBILE BOTTOM NAVIGATION */}
                <MobileNav />

            </div>
        </MessagesGatewayProvider>
    )
}