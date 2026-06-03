import { Sparkles } from 'lucide-react'
import { MarketingAuthActions } from '@/components/marketing/marketing-auth-actions'

export function CTASection() {
    return (
        <section className="bg-page py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="card-ai p-8 sm:p-12 lg:p-16">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-card border border-ai shadow-ai-md text-xs font-medium text-ai-gradient">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                            Developer conversations, with AI when it helps
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-bold text-heading mb-4 text-balance">
                            Join a network shaped around how developers actually work
                        </h2>

                        <p className="text-base text-body mb-8 leading-relaxed">
                            Share what you are building, ask focused technical questions,
                            follow useful developers, join communities, and keep important
                            answers within reach.
                        </p>

                        <MarketingAuthActions />
                    </div>
                </div>
            </div>
        </section>
    )
}
