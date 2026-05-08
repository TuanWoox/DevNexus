'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'

const ALLOWED_ROLES = ['Admin', 'Moderator']

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    const hasAccess = user?.roles?.some((r) => ALLOWED_ROLES.includes(r))
    if (!hasAccess) {
      router.replace('/unauthorized')
    }
  }, [isAuthenticated, isInitialized, user, router])

  if (!isInitialized) return null
  const hasAccess = isAuthenticated && user?.roles?.some((r) => ALLOWED_ROLES.includes(r))
  if (!hasAccess) return null

  return (
    <div className="min-h-screen bg-page text-body flex justify-center">
      <div className="w-full flex px-0 sm:px-4 lg:px-6 2xl:px-8">

        {/* ADMIN SIDEBAR — Desktop (sm+), sticky */}
        <AdminSidebar />

        {/* MAIN CONTENT COLUMN — mirrors MainLayout centre column */}
        <div className="flex-1 min-w-0 max-w-full border-x-0 sm:border-r border-default pb-20 sm:pb-0 flex flex-col overflow-x-hidden">
          <AdminHeader />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>

      </div>

      {/* MOBILE BOTTOM NAVIGATION — admin-specific nav */}
      <AdminMobileNav />
    </div>
  )
}
