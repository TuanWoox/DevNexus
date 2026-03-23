import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
    return (
        <section className="dark:bg-slate-900/50 bg-white py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl dark:bg-slate-800/80 bg-white border border-ai shadow-ai-md p-8 sm:p-12 lg:p-16">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-linear-to-br from-emerald-500/10 to-cyan-500/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 rounded-full bg-linear-to-tr from-indigo-500/10 to-purple-500/10 blur-3xl" />

                    <div className="relative text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-linear-to-r from-emerald-400 to-cyan-500 text-white text-xs font-medium shadow-ai-md">
                            <Sparkles className="h-3.5 w-3.5" />
                            Start Your Journey Today
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                            Ready to Accelerate Your Engineering Career?
                        </h2>

                        <p className="text-base dark:text-slate-300 text-slate-700 mb-8 leading-relaxed">
                            Join thousands of engineers who are already learning smarter with
                            DevNexus. Get personalized AI recommendations and connect with a
                            thriving community.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="w-full sm:w-auto text-white rounded-lg gap-2 h-12 px-8"
                            >
                                <Link href="/register">
                                    Get Started Free
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>

                            <p className="text-sm text-muted-foreground">
                                No credit card required
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
