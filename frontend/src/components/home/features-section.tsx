import {
    Sparkles,
} from 'lucide-react'
import { features } from '@/constants/static-data'

export function FeaturesSection() {
    return (
        <section
            id="features"
            className="dark:bg-slate-900/50 bg-white py-20 lg:py-28"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                        Features
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                        Everything You Need to Level Up
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        A complete platform designed to accelerate your engineering career
                        with cutting-edge tools and a supportive community.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className={`p-6 rounded-xl transition-colors duration-150 ${feature.isAI
                                ? 'dark:bg-slate-800/80 bg-white border border-ai shadow-ai-md'
                                : 'bg-card border dark:hover:border-slate-700 hover:border-gray-300'
                                }`}
                        >
                            <div
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${feature.isAI
                                    ? 'bg-linear-to-r from-emerald-400 to-cyan-500'
                                    : 'dark:bg-indigo-500/10 bg-indigo-50'
                                    }`}
                            >
                                <feature.icon
                                    className={`h-5 w-5 ${feature.isAI
                                        ? 'text-white'
                                        : 'text-primary'
                                        }`}
                                />
                            </div>

                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>

                            {feature.isAI && (
                                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium bg-linear-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                                    <Sparkles className="h-3 w-3 text-emerald-400" />
                                    AI Enhanced
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
