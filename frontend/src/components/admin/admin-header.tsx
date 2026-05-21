'use client'

import Link from 'next/link'
import { Hexagon, Sparkles, Search } from 'lucide-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id'
import { adminNavItems } from '@/components/admin/admin-sidebar'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/shared/user-avatar'

export function AdminHeader() {
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const { data: userProfile } = useGetProfileById(user?.profileId as string)
  const currentPage = adminNavItems.find((item) => pathname.startsWith(item.href))

  return (
    <header className="sm:hidden sticky top-0 h-14 bg-page/80 backdrop-blur-md border-b border-default flex items-center justify-between px-4 z-50">
      <Link href="/admin/dashboard" className="flex items-center gap-2">
        <div className="relative">
          <Hexagon className="h-7 w-7 animate-pulse text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-3 w-3 dark:text-emerald-400 text-emerald-500" />
          </div>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-heading text-sm">DevNexus</span>
          {currentPage && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              {currentPage.name}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button className="text-muted-foreground hover:text-primary transition-colors p-2">
          <Search className="h-5 w-5" />
        </button>
        <UserAvatar avatarUrl={userProfile?.avatarUrl} fullName={userProfile?.fullName ?? 'Admin'} className="w-10 h-10 border border-default" />
      </div>
    </header>
  )
}
