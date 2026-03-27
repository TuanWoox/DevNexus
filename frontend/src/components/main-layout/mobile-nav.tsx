'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Home, HelpCircle, Plus, Bell, User, Settings, Moon, Sun, LogOut, Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/use-logout'

export function MobileNav() {
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)
    const [isDark, setIsDark] = useState(true)
    const mobileDropdownRef = useRef<HTMLDivElement>(null)

    const { user } = useSelector((state: RootState) => state.auth)
    const { logout, isLoggingOut } = useLogout()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
                setIsMobileProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleTheme = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-page border-t border-default flex items-center justify-around px-2 z-50 pb-safe">
            <Link href="/feed" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-6 w-6" />
            </Link>
            <Link href="/questions" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <HelpCircle className="h-6 w-6" />
            </Link>

            <Link
                href="/post/create"
                className="btn-ai rounded-full w-12 h-12 flex items-center justify-center p-0 border-4 border-page shadow-elevated"
            >
                <Plus className="h-6 w-6" />
            </Link>

            <Link href="/notifications" className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-page"></span>
            </Link>

            <div className="relative flex items-center h-full" ref={mobileDropdownRef}>
                <button
                    onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
                    className={`p-2 transition-colors ${isMobileProfileOpen ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                    <User className="h-6 w-6" />
                </button>

                {isMobileProfileOpen && (
                    <div className="absolute bottom-full right-0 mb-4 w-56 bg-card border border-default rounded-xl shadow-elevated p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-3 py-2 mb-1 border-b border-default">
                            <span className="text-sm font-bold text-heading block truncate">@{user?.userName || 'username'}</span>
                            <span className="text-xs text-muted-foreground block truncate">{user?.roles || 'Role'}</span>
                        </div>

                        <Link
                            href="/profile"
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors"
                            onClick={() => setIsMobileProfileOpen(false)}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-sm font-medium">View Profile</span>
                        </Link>

                        <Link
                            href="/settings"
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors"
                            onClick={() => setIsMobileProfileOpen(false)}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium">Settings</span>
                        </Link>

                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors w-full"
                        >
                            <div className="flex items-center gap-3">
                                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                <span className="text-sm font-medium">Display Mode</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${isDark ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>

                        <div className="h-px bg-default my-1 w-full" />

                        <button
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full disabled:opacity-50"
                            onClick={() => { setIsMobileProfileOpen(false); logout(); }}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <LogOut className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
                                {isLoggingOut ? "Logging out..." : "Log Out"}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}
