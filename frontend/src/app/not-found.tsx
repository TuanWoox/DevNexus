import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Hexagon, Home, ArrowLeft, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        // Sử dụng bg-page
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1 flex items-center justify-center">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    {/* 404 Visual */}
                    <div className="relative mb-8">
                        <div className="flex items-center justify-center gap-4">
                            {/* Dùng text-border hoặc opacity-20 để tạo màu xám/slate nhẹ nhàng chuẩn theme */}
                            <span className="text-8xl sm:text-9xl font-bold text-muted-foreground">
                                4
                            </span>
                            <div className="relative">
                                {/* Dùng text-primary thay cho text-indigo */}
                                <Hexagon className="h-20 w-20 sm:h-24 sm:w-24 text-indigo-500 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 dark:text-emerald-400 text-emerald-500" />
                                </div>
                            </div>
                            <span className="text-8xl sm:text-9xl font-bold text-muted-foreground">
                                4
                            </span>
                        </div>
                    </div>

                    {/* Message */}
                    {/* Sử dụng text-heading, text-body */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-heading mb-4">
                        Page Not Found
                    </h1>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                        Looks like this page got lost in the codebase. Don&apos;t worry, even
                        the best engineers hit a{' '}
                        {/* Sử dụng text-primary cho chữ 404 */}
                        <span className="font-mono text-primary">
                            404
                        </span>{' '}
                        sometimes.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {/* Thay bằng btn-primary và btn-ghost */}
                        <Button
                            asChild
                            className="w-full sm:w-auto gap-2 text-white"
                        >
                            <Link href="/">
                                <Home className="h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>

                        <Button
                            variant="ghost"
                            asChild
                            className="w-full sm:w-auto btn-ghost gap-2"
                        >
                            <Link href="/faq">
                                <Search className="h-4 w-4" />
                                Browse FAQ
                            </Link>
                        </Button>
                    </div>

                    {/* Helpful Links */}
                    <div className="mt-12 pt-8 border-t">
                        {/* Sử dụng text-dimmed */}
                        <p className="text-sm text-dimmed mb-4">
                            Here are some helpful links instead:
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Homepage
                            </Link>
                            <span className="text-muted-foreground/50">|</span>
                            <Link
                                href="/about"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                About Us
                            </Link>
                            <span className="text-muted-foreground/50">|</span>
                            <Link
                                href="/faq"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                FAQ
                            </Link>
                        </div>
                    </div>

                    {/* Code Block Decoration */}
                    {/* Sử dụng trực tiếp class code-block để gom cả bg, border và radius */}
                    <div className="mt-12 code-block p-4 text-left max-w-sm mx-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        {/* Dùng các class syntax-* cho code */}
                        <pre className="font-mono text-xs sm:text-sm">
                            <code className="text-body">
                                <span className="syntax-keyword">
                                    const
                                </span>{' '}
                                <span className="syntax-function">
                                    page
                                </span>{' '}
                                ={' '}
                                <span className="syntax-keyword">
                                    await
                                </span>{' '}
                                find(
                                <span className="syntax-string">
                                    &apos;route&apos;
                                </span>
                                );
                                {'\n'}
                                <span className="syntax-comment">
                                    {'// '}
                                    Error: Page not found
                                </span>
                            </code>
                        </pre>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}