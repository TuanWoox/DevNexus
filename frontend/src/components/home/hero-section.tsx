import { Sparkles } from 'lucide-react'
import { productStats } from '@/constants/static-data'
import { MarketingAuthActions } from '@/components/marketing/marketing-auth-actions'

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-page">
            <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-card border border-ai shadow-ai-md">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-medium text-ai-gradient">
                            Social-first, AI-assisted
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-heading leading-tight tracking-tight text-balance mb-6">
                        The Developer Network for Code, Questions, and Communities
                    </h1>

                    <p className="text-lg sm:text-xl text-body max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
                        DevNexus brings developer posts, technical Q&A, focused communities,
                        realtime messaging, and AI-assisted code support into one place built
                        for programmers.
                    </p>

                    <MarketingAuthActions registerLabel="Join DevNexus" showRegisterIcon />

                    <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {productStats.map((stat) => (
                            <div key={stat.label} className="card p-5 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-heading">
                                    {stat.label}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
