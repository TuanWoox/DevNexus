'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { name: 'Moderation Queue', href: '/admin/moderation', icon: ShieldCheck, roles: ['Admin', 'Moderator'] },
  { name: 'Content Oversight', href: '/admin/posts', icon: FileText, roles: ['Admin', 'Moderator'] },
  { name: 'User Management', href: '/admin/users', icon: Users, roles: ['Admin'] },
  { name: 'Tag Management', href: '/admin/tags', icon: Tag, roles: ['Admin', 'Moderator'] },
  { name: 'AI Usage', href: '/admin/ai-usage', icon: BrainCircuit, roles: ['Admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['Admin'] },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const userRoles = user?.roles ?? []

  const visibleItems = adminNavItems.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  )

  return (
    <aside className="hidden sm:flex flex-col sticky top-0 h-screen py-6 border-r border-default sm:w-16 lg:w-64 sm:px-2 lg:px-0 lg:pr-6">
      {/* Logo */}
      <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8 px-3">
        <div className="relative shrink-0">
          <Hexagon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="text-base font-semibold text-heading leading-tight">DevNexus</span>
          <span className="text-xs text-muted-foreground">Admin Console</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex justify-center lg:justify-start items-center gap-3 p-3 rounded-xl transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-subtle hover:text-primary'
                }
              `}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
