'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

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

  // Render nothing while redirecting or initializing
  if (!isInitialized) return null
  const hasAccess = isAuthenticated && user?.roles?.some((r) => ALLOWED_ROLES.includes(r))
  if (!hasAccess) return null

  return (
    <div className="min-h-screen flex bg-page">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
