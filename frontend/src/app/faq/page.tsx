import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Sparkles, MessageCircle, Mail } from 'lucide-react'
// Nếu component Button của shadcn bị conflict style với btn-primary, bạn có thể cân nhắc 
// đổi thẻ Button thành thẻ <button> thường hoặc ghi đè className. Ở đây mình giữ nguyên thẻ Button.
import { Button } from '@/components/ui/button'
import { faqCategories } from '@/constants/static-data'

export const metadata: Metadata = {
    title: 'Frequently Asked Questions',
    description:
        'Find answers to common questions about DevNexus, our AI-powered learning platform for software engineers.',
}

export default function FAQPage() {
    return (
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-page py-16 lg:py-24">
                    <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto">
                            {/* Đã áp dụng bg-card, border-ai, shadow-ai-md */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-card border border-ai shadow-ai-md">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                {/* Đã áp dụng text-ai-gradient */}
                                <span className="text-xs font-medium text-ai-gradient">
                                    Help Center
                                </span>
                            </div>

                            {/* Đã áp dụng text-heading */}
                            <h1 className="text-4xl sm:text-5xl font-bold text-heading leading-tight mb-4 text-balance">
                                Frequently Asked Questions
                            </h1>

                            {/* Đã áp dụng text-body */}
                            <p className="text-lg text-body leading-relaxed">
                                Find answers to common questions about DevNexus. Can&apos;t find
                                what you&apos;re looking for? Our support team is here to help.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="bg-card py-16 lg:py-20">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        {faqCategories.map((category, categoryIndex) => (
                            <div key={category.name} className={categoryIndex > 0 ? 'mt-12' : ''}>
                                {/* Đã áp dụng text-heading */}
                                <h2 className="text-xl font-semibold text-heading mb-6 flex items-center gap-3">
                                    {/* Sử dụng map màu brand đã setup trong theme của bạn */}
                                    <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 flex items-center justify-center text-sm font-mono">
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

                {/* Contact Section */}
                <section className="bg-page py-16 lg:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center">
                            {/* Đã áp dụng bg-card, border-ai, shadow-ai-md */}
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-ai shadow-ai-md mb-6">
                                <MessageCircle className="h-7 w-7 text-emerald-500" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4 text-balance">
                                Still Have Questions?
                            </h2>

                            <p className="text-base text-muted-foreground-foreground mb-8 max-w-md mx-auto">
                                Our support team is available 24/7 to help you with any
                                questions or issues you might have.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {/* Đã áp dụng btn-primary */}
                                <Button className="w-full sm:w-auto btn-primary gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Start Live Chat
                                </Button>

                                {/* Đã áp dụng btn-ghost */}
                                <Button variant="ghost" className="w-full sm:w-auto btn-ghost gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Support
                                </Button>
                            </div>

                            <p className="mt-6 text-sm text-dimmed">
                                Average response time:{' '}
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                    {'<'} 2 hours
                                </span>
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}