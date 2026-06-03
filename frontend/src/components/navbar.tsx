'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Hexagon, Menu, Sun, Moon, Sparkles, LogOut, User, Loader2, Rss } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/auth-hooks/use-logout'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
]

export function Navbar() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
    const { logout, isLoggingOut } = useLogout()

    return (
        <header className="sticky top-0 z-50 h-14 backdrop-blur-md border-b">
            <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            {/* Dùng text-primary thay cho text-indigo */}
                            <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 dark:text-emerald-400 text-emerald-500" />
                            </div>
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            DevNexus
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium dark:text-slate-300 text-slate-700 hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="btn-ghost "
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 border-l">
                                <Button asChild className="btn-primary gap-2">
                                    <Link href="/feed">
                                        <Rss className="h-4 w-4" />
                                        Feed
                                    </Link>
                                </Button>

                                {/* Giao diện User Name */}
                                <div className="flex items-center cursor-pointer">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold whitespace-nowrap">
                                        @{user?.userName || 'Developer'}
                                    </span>
                                </div>

                                {/* Nút Logout Desktop */}
                                <Button
                                    variant="ghost"
                                    onClick={() => logout()}
                                    disabled={isLoggingOut}
                                    className="text-destructive transition-colors gap-2 btn-ghost"
                                >
                                    {isLoggingOut ? <Loader2 className="h-4 w-4 my-auto animate-spin" /> : <LogOut className="h-4 w-4 my-auto" />}
                                    Log out
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    asChild
                                    className="border dark:border-slate-700 border-gray-200 dark:text-slate-300 text-slate-700 dark:hover:bg-slate-800 hover:bg-gray-100 rounded-lg"
                                >
                                    <Link href="/login">Sign In</Link>
                                </Button>

                                <Button asChild className="text-white rounded-lg gap-2">
                                    <Link href="/register">
                                        <Sparkles className="h-4 w-4" />
                                        Get Started
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="dark:text-slate-300 text-slate-700"
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="dark:text-slate-300 text-slate-700"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-75 sm:w-100 bg-card border-l border-default p-6"
                            >
                                <div className="flex flex-col h-full">
                                    <SheetHeader className="mb-8 text-left">
                                        <SheetTitle asChild>
                                            <Link
                                                href="/"
                                                className="flex items-center gap-3"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <div className="relative">
                                                    <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 text-primary animate-pulse" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 dark:text-emerald-400 text-emerald-500" />
                                                    </div>
                                                </div>
                                                <span className="font-bold text-xl text-heading">
                                                    DevNexus
                                                </span>
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <nav className="flex flex-col gap-4 flex-1 mt-4">
                                        {navLinks.map((link) => (
                                            <SheetClose asChild key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    // {/* Typography to, rõ và có hiệu ứng mũi tên hover */}
                                                    className="text-lg font-medium text-body hover:text-primary transition-colors flex items-center justify-between group py-2"
                                                >
                                                    {link.label}
                                                    <span className="text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                                                        →
                                                    </span>
                                                </Link>
                                            </SheetClose>
                                        ))}
                                    </nav>

                                    {/* Component divider tự custom của bạn */}
                                    <div className="divider my-6" />

                                    <div className="flex flex-col gap-3">
                                        {isAuthenticated ? (
                                            <>
                                                <SheetClose asChild>
                                                    <Button asChild className="w-full btn-primary justify-center gap-2 py-6">
                                                        <Link href="/feed">
                                                            <Rss className="h-5 w-5" />
                                                            Go to Feed
                                                        </Link>
                                                    </Button>
                                                </SheetClose>

                                                {/* Giao diện tên user ở Mobile */}
                                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-2">
                                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex shrink-0 items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-heading">
                                                            @{user?.userName || 'Developer'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground uppercase py-0.5">
                                                            {user?.roles?.[0] || 'Member'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-destructive border border-destructive/20 hover:bg-destructive/10 hover:text-destructive justify-center py-6"
                                                    onClick={() => logout()}
                                                    disabled={isLoggingOut}
                                                >
                                                    {isLoggingOut ? <Loader2 className="h-5 w-5 my-auto animate-spin mr-2" /> : <LogOut className="h-5 w-5 mr-2" />}
                                                    Log out
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button asChild className="w-full btn-ghost justify-center py-6 text-white">
                                                    <Link href="/login">Sign In</Link>
                                                </Button>
                                                <Button asChild className="w-full btn-ai justify-center gap-2 py-6 text-white">
                                                    <Link href="/register">
                                                        <Sparkles className="h-5 w-5" />
                                                        Get Started Free
                                                    </Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}
