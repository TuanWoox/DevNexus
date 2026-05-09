'use client'

import { useState, useEffect } from 'react'
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
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
    const [isCollapsed, setIsCollapsed] = useState(true)

    useEffect(() => {
        // Thiết lập trạng thái ban đầu dựa trên kích thước màn hình
        const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCollapsed(!isLargeScreen)

        // Xử lý sự kiện resize
        const handleResize = () => {
            const isLarge = window.matchMedia('(min-width: 1024px)').matches
            if (!isLarge) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsCollapsed(true)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <aside
            className={cn(
                `hidden sm:flex flex-col sticky top-0 h-screen py-4 px-2 border-r border-default transition-all duration-300`,
                isCollapsed ? "w-18" : "w-60",
            )}
        >
            {/* Collapse toggle — pinned on the right border line */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-5 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-default text-muted-foreground hover:text-heading hover:bg-subtle transition-colors shadow-sm cursor-pointer"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronLeft className="w-3 h-3" />
                )}
            </button>

            {/* Header: logo */}
            <Link
                href="/feed"
                className={cn(
                    "flex items-center gap-3 mb-6",
                    isCollapsed ? "justify-center px-0" : "px-4",
                )}
            >
                <div className="relative shrink-0">
                    <Hexagon className="h-8 w-8 animate-pulse text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 dark:text-emerald-400 text-emerald-500" />
                    </div>
                </div>
                {!isCollapsed && (
                    <span className="text-2xl font-bold text-heading truncate">
                        DevNexus
                    </span>
                )}
            </Link>

            <nav className="flex flex-col gap-0.5">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-4 rounded-xl transition-colors group",
                                isCollapsed ? "justify-center py-3" : "px-3 py-3",
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-subtle hover:text-primary',
                            )}
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {!isCollapsed && (
                                <span className="text-base truncate font-medium">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className={cn("mt-3")}>
                <Link
                    href="/post/create"
                    className={cn(
                        "btn-ai justify-start flex items-center gap-4 rounded-xl transition-colors group",
                        isCollapsed ? "justify-center py-3" : "px-3 py-3",
                    )}
                    title={isCollapsed ? "Create Post" : undefined}
                >
                    {isCollapsed ? (
                        <Plus className="h-6 w-6 shrink-0" />
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5 shrink-0" />
                            <span className="text-base truncate font-semibold">Create Post</span>
                        </>
                    )}
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
                <SidebarUserMenu isCollapsed={isCollapsed} />
            </div>
        </aside>
    )
}
