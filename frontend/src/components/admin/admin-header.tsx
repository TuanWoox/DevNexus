'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import useLogout from '@/hooks/auth-hooks/use-logout'
import {
  LogOut,
  Loader2,
  Menu,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Users,
  Tag,
  BrainCircuit,
  Settings,
  Hexagon,
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { name: 'Moderation Queue', href: '/admin/moderation', icon: ShieldCheck, roles: ['Admin', 'Moderator'] },
  { name: 'Content Oversight', href: '/admin/posts', icon: FileText, roles: ['Admin', 'Moderator'] },
  { name: 'User Management', href: '/admin/users', icon: Users, roles: ['Admin'] },
  { name: 'Tag Management', href: '/admin/tags', icon: Tag, roles: ['Admin', 'Moderator'] },
  { name: 'AI Usage', href: '/admin/ai-usage', icon: BrainCircuit, roles: ['Admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['Admin'] },
]

export function AdminHeader() {
  const { user } = useSelector((state: RootState) => state.auth)
  const { logout, isLoggingOut } = useLogout()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const primaryRole = user?.roles?.[0] ?? 'User'
  const isAdmin = user?.roles?.includes('Admin')
  const userRoles = user?.roles ?? []

  const visibleItems = adminNavItems.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  )

  return (
    <header className="h-14 border-b border-default flex items-center justify-between px-4 sm:px-6 bg-card shrink-0">
      {/* Left: hamburger (mobile only) + label */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — only visible below sm */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="sm:hidden p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-subtle transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
            <div className="flex flex-col h-full py-6 px-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8 px-1">
                <div className="relative shrink-0">
                  <Hexagon className="h-8 w-8 text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-heading leading-tight">DevNexus</span>
                  <span className="text-xs text-muted-foreground">Admin Console</span>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                          ${isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-subtle hover:text-primary'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SheetClose>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
          Admin Console
        </span>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span
          className={`badge text-xs font-semibold px-2 py-0.5 rounded-full ${
            isAdmin
              ? 'bg-primary/10 text-primary'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {primaryRole}
        </span>

        {/* Username */}
        <span className="text-sm text-body font-semibold hidden sm:block">
          {user?.userName ?? '—'}
        </span>

        {/* Logout */}
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label="Log out"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="hidden sm:block">{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
        </button>
      </div>
    </header>
  )
}
