import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Sparkles } from 'lucide-react'
import { faqCategories } from '@/constants/static-data'
import { MarketingAuthActions } from '@/components/marketing/marketing-auth-actions'

export const metadata: Metadata = {
    title: 'DevNexus FAQ',
    description:
        'Find answers about DevNexus posts, Q&A, communities, AI assistance, messaging, notifications, privacy, and moderation.',
}

export default function FAQPage() {
    return (
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1">
                <section className="relative bg-page py-16 lg:py-24">
                    <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-card border border-ai shadow-ai-md">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-medium text-ai-gradient">
                                    Help Center
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-bold text-heading leading-tight mb-4 text-balance">
                                Frequently Asked Questions
                            </h1>

                            <p className="text-lg text-body leading-relaxed">
                                Learn how DevNexus handles developer posts, Q&A, communities,
                                AI assistance, messaging, notifications, privacy, and moderation.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-card py-16 lg:py-20">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        {faqCategories.map((category, categoryIndex) => (
                            <div key={category.name} className={categoryIndex > 0 ? 'mt-12' : ''}>
                                <h2 className="text-xl font-semibold text-heading mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-accent text-primary flex items-center justify-center text-sm font-mono">
                                        {categoryIndex + 1}
                                    </span>
                                    {category.name}
                                </h2>

                                <Accordion type="single" collapsible className="space-y-3">
                                    {category.questions.map((faq, index) => (
                                        <AccordionItem
                                            key={index}
                                            value={`${category.name}-${index}`}
                                            className="card px-6 data-[state=open]:border-strong"
                                        >
                                            <AccordionTrigger className="text-left text-heading hover:no-underline py-5 text-base font-medium">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-page py-16 lg:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-ai shadow-ai-md mb-6">
                                <HelpCircle className="h-7 w-7 text-primary" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4 text-balance">
                                Ready to join the discussion?
                            </h2>

                            <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
                                Create an account to post updates, ask questions, join communities,
                                save useful answers, and message other developers.
                            </p>

                            <MarketingAuthActions />
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
