import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
    Sparkles,
    Users,
    Github,
    Twitter,
    Linkedin,
} from 'lucide-react'
import { values, team, milestones } from '@/constants/static-data'

export const metadata: Metadata = {
    title: 'About Us',
    description:
        'Learn about DevNexus - our mission to empower software engineers with AI-enhanced learning.',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-page py-20 lg:py-28">
                    <div className="absolute inset-0 dark:bg-linear-to-b dark:from-indigo-500/5 dark:via-transparent dark:to-transparent bg-linear-to-b from-indigo-500/5 via-transparent to-transparent" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full dark:bg-slate-800/80 bg-white border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                <Sparkles className="h-4 w-4 dark:text-emerald-400 text-emerald-600" />
                                <span className="text-xs font-medium bg-linear-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                                    Our Story
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6 text-balance">
                                Building the Future of{' '}
                                <span className="bg-linear-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                                    Developer Education
                                </span>
                            </h1>

                            <p className="text-lg dark:text-slate-300 text-slate-700 leading-relaxed text-pretty">
                                DevNexus was born from a simple idea: learning to code should be
                                collaborative, personalized, and accessible to everyone. We are
                                building the social learning network that we wished existed when
                                we were starting our careers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="dark:bg-slate-900/50 bg-white py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                                    Our Mission
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
                                    Empowering Engineers to Reach Their Full Potential
                                </h2>
                                <p className="text-base dark:text-slate-300 text-slate-700 leading-relaxed mb-6">
                                    We believe that the best way to learn is by doing, together.
                                    DevNexus combines the power of AI with community-driven
                                    learning to create personalized experiences that adapt to each
                                    engineer&apos;s unique journey.
                                </p>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    Whether you&apos;re a beginner writing your first line of code
                                    or a senior engineer exploring new technologies, DevNexus is
                                    your home for continuous growth.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {values.map((value) => (
                                    <div
                                        key={value.title}
                                        className="flex gap-4 p-5 rounded-xl bg-card border dark:hover:border-slate-700 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="shrink-0 w-10 h-10 rounded-lg dark:bg-indigo-500/10 bg-indigo-50 flex items-center justify-center">
                                            <value.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground mb-1">
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

                {/* Timeline Section */}
                <section className="bg-page py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                                Our Journey
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
                                Milestones Along the Way
                            </h2>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                                <div className="space-y-8">
                                    {milestones.map((milestone, index) => (
                                        <div key={index} className="relative flex gap-6 pl-12">
                                            <div className="absolute left-2 w-5 h-5 rounded-full bg-primary border-4" />
                                            <div className="flex-1 pb-8">
                                                <span className="font-mono text-sm text-primary font-medium">
                                                    {milestone.year}
                                                </span>
                                                <p className="dark:text-slate-300 text-slate-700 mt-1">
                                                    {milestone.event}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="dark:bg-slate-900/50 bg-white py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <p className="text-xs uppercase tracking-wider font-medium text-primary mb-3">
                                Our Team
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                                Meet the People Behind DevNexus
                            </h2>
                            <p className="text-base text-muted-foreground">
                                A passionate team of engineers, designers, and educators working
                                to transform how developers learn.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {team.map((member) => (
                                <div
                                    key={member.name}
                                    className="p-6 rounded-xl bg-card border dark:hover:border-slate-700 hover:border-gray-300 transition-colors text-center"
                                >
                                    <div className="w-16 h-16 mx-auto rounded-full dark:bg-indigo-500/10 bg-indigo-50 flex items-center justify-center mb-4">
                                        <span className="font-mono text-lg font-semibold text-primary">
                                            {member.avatar}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-foreground mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm text-primary mb-3">
                                        {member.role}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {member.bio}
                                    </p>

                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <a
                                            href="#"
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <Twitter className="h-4 w-4" />
                                        </a>
                                        <a
                                            href="#"
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <Linkedin className="h-4 w-4" />
                                        </a>
                                        <a
                                            href="#"
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <Github className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Join Section */}
                <section className="bg-page py-20 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 mb-6">
                                <Users className="h-7 w-7 text-white" />
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                                Join Our Growing Community
                            </h2>
                            <p className="text-base text-muted-foreground mb-8">
                                Be part of the movement to make engineering education more
                                accessible and effective for everyone.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="/"
                                    className="btn-primary text-white"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Get Started
                                </a>
                                <a
                                    href="#"
                                    className="btn-ghost"
                                >
                                    View Open Positions
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}