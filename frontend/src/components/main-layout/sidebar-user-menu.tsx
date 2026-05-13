'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
    User,
    LogOut,
    Moon,
    Sun,
    Settings,
    ChevronDown,
    Loader2,
    ShieldCheck
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/auth-hooks/use-logout'
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { cn } from '@/lib/utils'

/**
 * SidebarUserMenu — Client Component isolated to contain all
 * theme/auth-dependent Radix UI components.
 *
 * By isolating this here, the Radix ID counter starts from a
 * deterministic position in the tree on both server and client,
 * preventing hydration mismatches in downstream components.
 */
export function SidebarUserMenu({ isCollapsed }: { isCollapsed?: boolean }) {
    const hasMounted = useHasMounted()
    const { theme, setTheme } = useTheme()

    const { user } = useSelector((state: RootState) => state.auth)
    const { data: userProfile, isPending } = useGetProfileById(user?.profileId as string)
    const { logout, isLoggingOut } = useLogout()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    // On SSR and initial hydration, render a stable placeholder.
    // This keeps the Radix ID counter consistent across renders
    // and prevents downstream components (e.g. PostActionsDropdown)
    // from getting mismatched IDs.
    if (!hasMounted || isPending) {
        return (
            <div className={cn(
                "flex items-center gap-3 p-2 w-full rounded-xl",
                isCollapsed ? "justify-center" : "justify-center lg:justify-start"
            )}>
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex items-center justify-center shrink-0 border border-default">
                </div>
                {!isCollapsed && (
                    <div className="hidden lg:flex flex-col text-left flex-1 overflow-hidden gap-1">
                        <div className="h-3.5 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-14 bg-muted rounded animate-pulse" />
                    </div>
                )}
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center gap-3 p-2 w-full rounded-xl hover:bg-subtle transition-colors group",
                    isCollapsed ? "justify-center" : "justify-center lg:justify-start"
                )}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                        {userProfile?.avatarUrl ? (
                            <Image src={userProfile.avatarUrl} alt={userProfile.fullName} fill unoptimized className="object-cover" />
                        ) : (
                            <span className="text-primary font-bold">{userProfile?.fullName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-col text-left flex-1 overflow-hidden">
                                <span className="text-sm font-semibold text-heading truncate">{userProfile?.fullName || 'username'}</span>
                                <span className="text-xs font-semibold text-muted-foreground truncate">{user?.roles || 'Role'}</span>
                            </div>
                            <ChevronDown className="block w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="center" sideOffset={8} className="w-52 bg-card border border-default rounded-xl ms-2 shadow-elevated p-2 flex flex-col gap-1 z-50">
                <DropdownMenuItem
                    asChild
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                >
                    <Link href={`/profile/${user?.profileId}`}>
                        <User className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">View Profile</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                    asChild
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                >
                    <Link href="/settings">
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">Settings</span>
                    </Link>
                </DropdownMenuItem>

                {(user?.roles?.includes('Admin') || user?.roles?.includes('Moderator')) && (
                    <DropdownMenuItem
                        asChild
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer"
                    >
                        <Link
                            href={user?.roles?.includes('Admin') ? '/admin/dashboard' : '/admin/moderation'}
                        >
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">Admin Workspace</span>
                        </Link>
                    </DropdownMenuItem>
                )}

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

                <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    variant='destructive'
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
    )
}
