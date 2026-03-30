'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
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
    User,
    LogOut,
    Moon,
    Sun,
    Settings,
    ChevronDown,
    Loader2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/auth-hooks/use-logout'

const menuItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Q&A', href: '/questions', icon: HelpCircle },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
]

export function LeftSidebar() {
    const pathname = usePathname()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const { user } = useSelector((state: RootState) => state.auth)
    const { logout, isLoggingOut } = useLogout()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <aside className="hidden sm:flex flex-col sticky top-0 h-screen py-6 border-r border-default sm:w-20 lg:w-64 sm:pr-2 lg:pr-6">
            <Link href="/feed" className="flex items-center gap-3 mb-8 px-3">
                <div className="relative">
                    <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 dark:text-emerald-400 text-emerald-500" />
                    </div>
                </div>
                <span className="text-xl font-bold text-heading hidden lg:block">
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
                            className={`flex sm:justify-center lg:justify-start items-center gap-4 p-3 rounded-xl transition-colors group
                                ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-subtle hover:text-primary'
                                }
                            `}
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            <span className="hidden lg:block text-base">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-4">
                <Link
                    href="/post/create"
                    className="btn-ai w-full p-3 sm:justify-center lg:justify-start lg:px-4 lg:py-3 h-auto"
                >
                    <Plus className="h-6 w-6 lg:hidden" />
                    <Sparkles className="h-5 w-5 hidden lg:block shrink-0" />
                    <span className="hidden lg:block text-base font-semibold">
                        Create Post
                    </span>
                </Link>
            </div>

            <div className="mt-auto pt-4 relative" ref={dropdownRef}>
                {isProfileOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-full lg:w-56 bg-card border border-default rounded-xl shadow-elevated p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <Link
                            href="/profile"
                            className="flex sm:justify-center lg:justify-start items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-sm font-medium hidden lg:block">View Profile</span>
                        </Link>

                        <Link
                            href="/settings"
                            className="flex sm:justify-center lg:justify-start items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium hidden lg:block">Settings</span>
                        </Link>

                        <button
                            onClick={toggleTheme}
                            className="flex sm:justify-center lg:justify-start items-center p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors w-full"
                        >
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                <span className="text-sm font-medium hidden lg:block">Display Mode</span>
                                <div className={`w-8 h-4 hidden lg:flex rounded-full items-center px-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </button>

                        <div className="h-px bg-default my-1 w-full" />

                        <button
                            className="flex sm:justify-center lg:justify-start items-center gap-3 p-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full disabled:opacity-50"
                            onClick={() => { setIsProfileOpen(false); logout(); }}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <LogOut className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium hidden lg:block">
                                {isLoggingOut ? "Logging out..." : "Log Out"}
                            </span>
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-2 w-full rounded-xl hover:bg-subtle transition-colors group"
                >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-10 lg:w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {user?.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:flex flex-col text-left flex-1 overflow-hidden">
                        <span className="text-sm font-bold text-heading truncate">@{user?.userName || 'username'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.roles || 'Role'}</span>
                    </div>
                    <ChevronDown className={`hidden lg:block w-4 h-4 text-muted-foreground transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </aside>
    )
}

