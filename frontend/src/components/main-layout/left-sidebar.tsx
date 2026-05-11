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
    Sparkles,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarUserMenu } from './sidebar-user-menu'

import { useUnreadCount } from "@/features/notifications/hooks/notifications/use-unread-count"
import { NotificationPanel } from "@/components/notification/notification-panel"

const menuItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Q&A', href: '/questions', icon: HelpCircle },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
]

export function LeftSidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === 'undefined') return true
        return !window.matchMedia('(min-width: 1024px)').matches
    })
    const [isPanelOpen, setIsPanelOpen] = useState(false)

    const { data: unreadCount = 0 } = useUnreadCount()

    useEffect(() => {
        const handleResize = () => {
            const isLarge = window.matchMedia('(min-width: 1024px)').matches
            if (!isLarge) setIsCollapsed(true)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <>
            <aside
                className={cn(
                    "hidden sm:flex flex-col sticky top-0 h-screen py-4 px-2 border-r border-default transition-all duration-300",
                    isCollapsed ? "w-18" : "w-60",
                )}
            >
                {/* Collapse toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-5 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-default text-muted-foreground hover:text-heading hover:bg-subtle transition-colors shadow-sm"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                    ) : (
                        <ChevronLeft className="w-3 h-3" />
                    )}
                </button>

                {/* Logo */}
                <Link
                    href="/feed"
                    className={cn(
                        "flex items-center gap-3 mb-6",
                        isCollapsed ? "justify-center px-0" : "px-3",
                    )}
                >
                    <div className="relative shrink-0">
                        <Hexagon className="h-8 w-8 animate-pulse text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                        </div>
                    </div>
                    {!isCollapsed && (
                        <span className="text-2xl font-bold text-heading truncate">
                            DevNexus
                        </span>
                    )}
                </Link>

                {/* Menu */}
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

                {/* Notifications */}
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={cn(
                        "relative flex items-center gap-4 rounded-xl transition-colors group mt-2",
                        isCollapsed ? "justify-center py-3" : "px-3 py-3",
                        isPanelOpen
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-subtle hover:text-primary',
                    )}
                >
                    <div className="relative">
                        <Bell className="h-6 w-6 shrink-0" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>

                    {!isCollapsed && <span>Notifications</span>}
                </button>

                {/* Create post */}
                <div className="mt-3">
                    <Link
                        href="/post/create"
                        className={cn(
                            "btn-ai flex items-center gap-4 rounded-xl",
                            isCollapsed ? "justify-center py-3" : "px-3 py-3",
                        )}
                    >
                        <Sparkles className="h-5 w-5" />
                        {!isCollapsed && <span>Create Post</span>}
                    </Link>
                </div>

                {/* User menu (from main branch - KEEP THIS) */}
                <div className="mt-auto pt-4">
                    <SidebarUserMenu isCollapsed={isCollapsed} />
                </div>
            </aside>

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
            />
        </>
    )
}