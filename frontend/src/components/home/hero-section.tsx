import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-page">
            {/* Background gradient */}
            <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full dark:bg-slate-800/80 bg-white border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <Sparkles className="h-4 w-4 dark:text-emerald-400 text-emerald-600" />
                        <span className="text-xs font-medium bg-linear-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                            AI-Powered Learning
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight text-balance mb-6">
                        The Learning Network Built for{' '}
                        <span className="bg-linear-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                            Engineers
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl dark:text-slate-300 text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
                        Connect with fellow developers, share knowledge, and accelerate your
                        growth with AI-enhanced learning paths tailored to your goals.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="w-full sm:w-auto text-white rounded-lg gap-2 h-12 px-6"
                        >
                            <Link href="/register">
                                <Sparkles className="h-4 w-4" />
                                Start Learning Free
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>

                        <Button
                            variant="ghost"
                            size="lg"
                            className="w-full sm:w-auto rounded-lg gap-2 h-12 px-6"
                        >
                            <Play className="h-4 w-4" />
                            Watch Demo
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-foreground">
                                50K+
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Engineers
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-foreground">
                                1M+
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Lessons
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-foreground">
                                500+
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Topics
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
