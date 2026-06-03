import { Sparkles } from 'lucide-react'
import { features } from '@/constants/static-data'

export function FeaturesSection() {
    return (
        <section id="features" className="bg-card py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                        Platform
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-heading mb-4 text-balance">
                        Social workflows built for developers
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        DevNexus keeps technical discussions, Q&A, communities, messages,
                        saved knowledge, and moderation in one developer-focused network.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className={feature.isAI ? 'card-ai p-6' : 'card p-6'}
                        >
                            <div
                                className={
                                    feature.isAI
                                        ? 'inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-linear-to-r from-emerald-400 to-cyan-500'
                                        : 'inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 bg-accent'
                                }
                            >
                                <feature.icon
                                    className={feature.isAI ? 'h-5 w-5 text-white' : 'h-5 w-5 text-primary'}
                                />
                            </div>

                            <h3 className="text-lg font-semibold text-heading mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>

                            {feature.isAI && (
                                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ai-gradient">
                                    <Sparkles className="h-3 w-3 text-emerald-400" />
                                    AI assisted
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
