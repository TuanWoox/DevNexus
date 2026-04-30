'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'
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
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const menuItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Q&A', href: '/questions', icon: HelpCircle },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
]

export function LeftSidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    const { user } = useSelector((state: RootState) => state.auth)
    const { data: userProfile } = useGetProfileById(user?.profileId as string);
    const { logout, isLoggingOut } = useLogout()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <aside className="hidden sm:flex flex-col sticky top-0 h-screen py-6 border-r border-default sm:w-16 lg:w-64 sm:px-2 lg:px-0 lg:pr-6">
            <Link href="/feed" className="flex items-center gap-3 mb-6 px-3">
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
                    className="btn-ai w-full p-3 flex justify-center lg:justify-start lg:px-4 lg:py-3 h-auto"
                >
                    <Plus className="h-6 w-6 lg:hidden" />
                    <Sparkles className="h-5 w-5 hidden lg:block shrink-0" />
                    <span className="hidden lg:block text-base font-semibold">
                        Create Post
                    </span>
                </Link>
            </div>

            <div className="mt-auto pt-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button suppressHydrationWarning className="flex justify-center lg:justify-start items-center gap-3 p-2 w-full rounded-xl hover:bg-subtle transition-colors group">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                                {userProfile?.avatarUrl ? (
                                    <Image src={userProfile.avatarUrl} alt={userProfile.fullName} fill className="object-cover" />
                                ) : (
                                    <span className="text-primary font-bold">{userProfile?.fullName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div className="hidden lg:flex flex-col text-left flex-1 overflow-hidden">
                                <span className="text-sm font-bold text-heading truncate">{userProfile?.fullName || 'username'}</span>
                                <span className="text-xs text-muted-foreground truncate">{user?.roles || 'Role'}</span>
                            </div>
                            <ChevronDown className="hidden lg:block w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" sideOffset={8} className="w-52 bg-card border border-default rounded-xl shadow-elevated p-2 flex flex-col gap-1 z-50">
                        <DropdownMenuItem asChild>
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                            >
                                <User className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">View Profile</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link
                                href="/settings"
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                            >
                                <Settings className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">Settings</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={toggleTheme}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                        >
                            {theme === 'dark' ? <Moon className="w-5 h-5 shrink-0" /> : <Sun className="w-5 h-5 shrink-0" />}
                            <span className="text-sm font-medium flex-1">Display Mode</span>
                            <div className={`w-8 h-4 flex rounded-full items-center px-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-default my-1" />

                        <DropdownMenuItem
                            onClick={() => logout()}
                            disabled={isLoggingOut}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                            ) : (
                                <LogOut className="w-5 h-5 shrink-0" />
                            )}
                            <span className="text-sm font-medium">
                                {isLoggingOut ? "Logging out..." : "Log Out"}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}
