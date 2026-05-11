'use client'

import { useState } from 'react'
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
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/auth-hooks/use-logout'
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useUnreadCount } from "@/features/notifications/hooks/notifications/use-unread-count";
import { NotificationPanel } from "@/components/notification/notification-panel";

const menuItems = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Q&A', href: '/questions', icon: HelpCircle },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
]

export function LeftSidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const { data: unreadCount = 0 } = useUnreadCount()

    const { user } = useSelector((state: RootState) => state.auth)
    const { data: userProfile } = useGetProfileById(user?.profileId as string);
    const { logout, isLoggingOut } = useLogout()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <>
            <aside
                className={cn(
                    "relative hidden sm:flex flex-col sticky top-0 h-screen py-4 border-r border-default transition-all duration-300",
                    isPanelOpen ? "w-18" : (isCollapsed ? "w-18" : "w-60"),
                )}
            >
                {/* Collapse toggle — pinned on the right border line */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-5 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-default text-muted-foreground hover:text-heading hover:bg-subtle transition-colors shadow-sm"
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
                                    isCollapsed ? "justify-center mx-2 py-3" : "mx-2 px-3 py-3",
                                    isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-subtle hover:text-primary',
                                )}
                            >
                                <item.icon className="h-6 w-6 shrink-0" />
                                {!isCollapsed && (
                                    <span className="text-base truncate">
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Notification Bell */}
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={cn(
                        "relative flex items-center gap-4 rounded-xl transition-colors group mx-2 py-3",
                        isPanelOpen || isCollapsed ? "justify-center" : "px-3",
                        isPanelOpen
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-subtle hover:text-primary',
                    )}
                    title={isPanelOpen || isCollapsed ? "Notifications" : undefined}
                >
                    <div className="relative">
                        <Bell className="h-6 w-6 shrink-0" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    {!isPanelOpen && !isCollapsed && (
                        <span className="text-base truncate">Notifications</span>
                    )}
                </button>

                <div className={cn("mt-3", isCollapsed ? "mx-2" : "mx-3")}>
                    <Link
                        href="/post/create"
                        className={cn(
                            "btn-ai h-auto flex items-center gap-3 rounded-xl transition-colors",
                            isCollapsed ? "justify-center p-3" : "px-4 py-3",
                        )}
                        title={isCollapsed ? "Create Post" : undefined}
                    >
                        {isCollapsed ? (
                            <Plus className="h-6 w-6 shrink-0" />
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 shrink-0" />
                                <span className="text-base font-semibold">Create Post</span>
                            </>
                        )}
                    </Link>
                </div>

                <div className="mt-auto pt-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button suppressHydrationWarning className={cn(
                                "flex items-center gap-3 p-2 w-full rounded-xl hover:bg-subtle transition-colors group",
                                isCollapsed && "justify-center",
                            )}>
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                                    {userProfile?.avatarUrl ? (
                                        <Image src={userProfile.avatarUrl} alt={userProfile.fullName} fill className="object-cover" />
                                    ) : (
                                        <span className="text-primary font-bold">{userProfile?.fullName?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex flex-col text-left flex-1 overflow-hidden">
                                            <span className="text-sm font-bold text-heading truncate">{userProfile?.fullName || 'username'}</span>
                                            <span className="text-xs text-muted-foreground truncate">{user?.roles || 'Role'}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </>
                                )}
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

            {/* Notification Panel - sibling to sidebar */}
            <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        </>
    )
}
