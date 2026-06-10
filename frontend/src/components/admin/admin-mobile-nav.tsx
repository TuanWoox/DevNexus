'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Tag,
  BrainCircuit,
  Settings,
  History,
  Flag,
  User,
  LogOut,
  Moon,
  Sun,
  Loader2,
  LayoutGrid,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id'
import useLogout from '@/hooks/auth-hooks/use-logout'

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { name: 'Review Queue', href: '/admin/review-queue', icon: ClipboardCheck, roles: ['Admin', 'Moderator'] },
  { name: 'Reports', href: '/admin/reports', icon: Flag, roles: ['Admin', 'Moderator'] },
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['Admin'] },
  { name: 'Tags', href: '/admin/tags', icon: Tag, roles: ['Admin', 'Moderator'] },
  { name: 'AI Usage', href: '/admin/ai-usage', icon: BrainCircuit, roles: ['Admin'] },
  { name: 'Audit', href: '/admin/audit-logs', icon: History, roles: ['Admin'] },
]

export function AdminMobileNav() {
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const { user } = useSelector((state: RootState) => state.auth)
  const { data: userProfile } = useGetProfileById(user?.profileId as string)
  const { logout, isLoggingOut } = useLogout()

  const userRoles = user?.roles
  const visibleItems = adminNavItems.filter((item) =>
    item.roles.some((r) => userRoles?.includes(r))
  ).slice(0, 6)

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
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-page border-t border-default flex items-center justify-around px-2 z-50 pb-safe">
      {visibleItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`p-2 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        )
      })}

      <Link
        href="/admin/settings"
        className={`p-2 transition-colors ${
          pathname.startsWith('/admin/settings') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <Settings className="h-6 w-6" />
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
              <span className="text-sm font-bold text-heading block truncate">{userProfile?.fullName ?? 'Admin'}</span>
              <span className="text-xs text-muted-foreground block truncate">{userRoles?.join(', ') ?? 'Admin'}</span>
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
              href="/feed"
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors"
              onClick={() => setIsMobileProfileOpen(false)}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-sm font-medium">Return App</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle text-body hover:text-heading transition-colors w-full"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span className="text-sm font-medium">Display Mode</span>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
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
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
