// Layout test lấy của auth qua

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-page relative">

            {/* Background chung */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-3xl opacity-20 bg-linear-to-br from-emerald-500 to-cyan-500 rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-3xl opacity-20 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full" />
            </div>

            {/* Header */}
            <Navbar />

            {/* Nội dung page */}
            <main className="flex-1 flex items-center justify-center p-4 mt-5 mb-10 z-10 relative">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    )
}