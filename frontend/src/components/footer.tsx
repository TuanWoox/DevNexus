import Link from 'next/link'
import { Hexagon, Github, Twitter, Linkedin, Sparkles } from 'lucide-react'

const footerLinks = {
    product: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'FAQ', href: '/faq' },
    ],
    company: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
    ],
    resources: [
        { label: 'Documentation', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Support', href: '#' },
    ],
    legal: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookies', href: '#' },
    ],
}

const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export function Footer() {
    return (
        <footer className="bg-page border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="relative">
                                {/* Dùng text-primary thay cho text-indigo */}
                                <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-500 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 dark:text-emerald-400 text-emerald-500" />
                                </div>
                            </div>
                            <span className="font-bold text-lg text-foreground">
                                DevNexus
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                            The learning network built for engineers. Connect, learn, and grow
                            with AI-powered insights.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className="text-muted-foreground hover:dark:text-slate-300 hover:text-slate-700 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider font-medium text-foreground mb-4">
                            Product
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:dark:text-slate-300 hover:text-slate-700 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wider font-medium text-foreground mb-4">
                            Company
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:dark:text-slate-300 hover:text-slate-700 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wider font-medium text-foreground mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:dark:text-slate-300 hover:text-slate-700 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs uppercase tracking-wider font-medium text-foreground mb-4">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:dark:text-slate-300 hover:text-slate-700 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} DevNexus. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
