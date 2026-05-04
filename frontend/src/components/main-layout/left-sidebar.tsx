'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Hexagon,
    Home,
    HelpCircle,
    Users,
    MessageSquare,
    Bell,
    Plus,
    Sparkles,
} from 'lucide-react'
import { SidebarUserMenu } from './sidebar-user-menu'

const menuItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Q&A', href: '/questions', icon: HelpCircle },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
]

export function LeftSidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden sm:flex flex-col sticky top-0 h-screen py-6 border-r border-gray-300 dark:border-gray-800 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-[2px_0_15px_-3px_rgba(0,0,0,0.4)] z-10 sm:w-16 lg:w-64 sm:px-2 lg:px-6">
            <Link href="/feed" className="flex items-center gap-3 mb-6 px-3 justify-center lg:justify-start">
                <div className="relative">
                    <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 dark:text-emerald-400 text-emerald-500" />
                    </div>
                </div>
                <span className="text-2xl font-bold text-heading hidden lg:block">
                    DevNexus
                </span>
            </Link>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex justify-center lg:justify-start items-center gap-4 p-3 rounded-xl transition-colors group
                                ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-subtle hover:text-primary'
                                }
                            `}
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            <span className="hidden lg:block text-base font-medium">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-4">
                <Link
                    href="/post/create"
                    className="btn-ai w-full p-3 flex justify-center lg:justify-start lg:px-4 lg:py-3 h-auto"
                >
                    <Plus className="h-6 w-6 lg:hidden" />
                    <Sparkles className="h-5 w-5 hidden lg:block shrink-0" />
                    <span className="hidden lg:block text-base font-semibold">
                        Create Post
                    </span>
                </Link>
            </div>

            {/*
             * SidebarUserMenu is isolated into its own component.
             * It contains all Radix DropdownMenu + theme/auth state.
             * Isolating it prevents those Radix ID counters from affecting
             * sibling subtrees (e.g. PostActionsDropdown in the feed/profile pages)
             * which would cause hydration mismatches.
             */}
            <div className="mt-auto pt-4">
                <SidebarUserMenu />
            </div>
        </aside>
    )
}
