import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ShieldAlert, Home, Headset } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col bg-page relative overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Dùng màu amber/red cảnh báo cho lỗi 403 */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-3xl opacity-20 bg-gradient-to-br from-amber-500 to-red-500 rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-3xl opacity-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full" />
            </div>

            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-20 relative">
                <div className="text-center max-w-2xl mx-auto w-full relative">

                    {/* Content Wrapper đè lên trên chữ 403 */}
                    <div className="relative z-10 flex flex-col items-center">

                        {/* Icon & Badge */}
                        <div className="flex items-center justify-center gap-4">
                            {/* Dùng text-border hoặc opacity-20 để tạo màu xám/slate nhẹ nhàng chuẩn theme */}
                            <span className="text-8xl sm:text-9xl font-bold text-muted-foreground">
                                4
                            </span>
                            <div className="relative">
                                <div className="mb-2 flex flex-col items-center gap-4">
                                    <span className="badge-amber">Error 403</span>
                                    <ShieldAlert className="h-20 w-20 sm:h-24 sm:w-24 text-primary animate-pulse" />
                                </div>
                            </div>
                            <span className="text-8xl sm:text-9xl font-bold text-muted-foreground">
                                3
                            </span>
                        </div>


                        {/* Tiêu đề & Mô tả */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-heading mt-6 mb-4">
                            Access Denied
                        </h1>
                        <p className="text-base text-body max-w-md mx-auto mb-8 text-balance">
                            You don&apos;t have permission to access this resource. This area is highly classified or requires an upgraded account level.
                        </p>

                        {/* Code Block Decoration (Đặc trưng của DevNexus) */}
                        <div className="code-block w-full max-w-md mx-auto mb-10 text-left">
                            <div className="code-block-header">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground mr-2">forbidden.json</span>
                            </div>
                            <div className="code-content">
                                <pre>
                                    <code>
                                        {`{\n  `}
                                        <span className="syntax-keyword">"status"</span>: <span className="syntax-number">403</span>{`,\n  `}
                                        <span className="syntax-keyword">"error"</span>: <span className="syntax-string">"Forbidden"</span>{`,\n  `}
                                        <span className="syntax-keyword">"message"</span>: <span className="syntax-string">"Insufficient permissions to execute this action."</span>{`,\n  `}
                                        <span className="syntax-keyword">"roleRequired"</span>: [<span className="syntax-string">"ADMIN"</span>, <span className="syntax-string">"PRO_MEMBER"</span>]{`\n}`}
                                    </code>
                                </pre>
                            </div>
                        </div>

                        {/* Buttons Hành động */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                            <Link href="/" className="btn-primary gap-2 w-full sm:w-auto">
                                <Home className="h-4 w-4" />
                                Return to Homepage
                            </Link>
                            <Link href="#" className="btn-ghost gap-2 w-full sm:w-auto">
                                <Headset className="h-4 w-4" />
                                Contact Support (Not implemented yet)
                            </Link>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}