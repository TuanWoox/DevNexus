import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Network, Sparkles } from 'lucide-react'
import { developerWorkflows, platformAreas, values } from '@/constants/static-data'
import { MarketingAuthActions } from '@/components/marketing/marketing-auth-actions'

export const metadata: Metadata = {
    title: 'About DevNexus',
    description:
        'Learn how DevNexus brings developer posts, Q&A, communities, messaging, moderation, and AI-assisted coding support into one social network.',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1">
                <section className="relative bg-page py-20 lg:py-28">
                    <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-card border border-ai shadow-ai-md">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-medium text-ai-gradient">
                                    About DevNexus
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-bold text-heading leading-tight mb-6 text-balance">
                                Built for developer conversations
                            </h1>

                            <p className="text-lg text-body leading-relaxed text-pretty">
                                Developer knowledge is scattered across feeds, Q&A threads,
                                chats, bookmarks, and community spaces. DevNexus brings those
                                workflows together in one network for programmers.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-card py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                                    Mission
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-heading mb-6 text-balance">
                                    Give programmers a focused place to exchange practical knowledge
                                </h2>
                                <p className="text-base text-body leading-relaxed mb-6">
                                    DevNexus is designed around the way developers already work:
                                    sharing implementation notes, asking focused questions,
                                    joining topic-based spaces, following useful people, and
                                    keeping important answers within reach.
                                </p>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    AI is part of that workflow when it helps explain code,
                                    draft useful context, generate diagrams, or support moderation.
                                    The network remains centered on developers and their discussions.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {values.map((value) => (
                                    <div key={value.title} className="card p-5 flex gap-4">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                                            <value.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-heading mb-1">
                                                {value.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {value.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-page py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                                Product Areas
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-heading mb-4 text-balance">
                                One platform for the social side of software development
                            </h2>
                            <p className="text-base text-muted-foreground">
                                DevNexus connects the places where developer knowledge is created,
                                discussed, moderated, and saved.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {platformAreas.map((area) => (
                                <div key={area.title} className="card p-6">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent mb-4">
                                        <area.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-heading mb-2">
                                        {area.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {area.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-card py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {developerWorkflows.map((workflow) => (
                                <div key={workflow.title} className="card p-6">
                                    <workflow.icon className="h-6 w-6 text-primary mb-4" />
                                    <h3 className="font-semibold text-heading mb-2">
                                        {workflow.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {workflow.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-page py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-ai shadow-ai-md mb-6">
                                <Network className="h-7 w-7 text-primary" />
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-bold text-heading mb-4 text-balance">
                                Join the developer network
                            </h2>
                            <p className="text-base text-muted-foreground mb-8">
                                Share posts, ask questions, join communities, and stay connected
                                to the technical conversations that matter to your work.
                            </p>

                            <MarketingAuthActions showRegisterIcon />
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
