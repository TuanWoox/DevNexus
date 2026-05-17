'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { FilterOperator } from '@/constants/filterOperator'
import { FilterType } from '@/constants/filterType'
import { RootState } from '@/store/store'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminUsersTable } from '@/components/admin/users/admin-users-table'
import { useGetAdminUsers } from '@/hooks/admin/use-get-admin-users'
import { FilterMapping, Page } from '@/types/common/page'

const SKELETON_COLS = 7
const DEFAULT_PAGE_SIZE = 20
const ALL_ROLES = 'All'
const SEARCH_DEBOUNCE_MS = 400

function UsersTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-default bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-default bg-card">
            {Array.from({ length: SKELETON_COLS }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="h-14 border-b border-default last:border-0">
              {Array.from({ length: SKELETON_COLS }).map((__, j) => (
                <td key={j} className="px-4 py-2">
                  <Skeleton className="h-5 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function buildFilter(prop: string, value: string, filterOperator: FilterOperator, filterType: FilterType): FilterMapping {
  return { prop, value, filterOperator, filterType, dynamicProperty: '', delimiter: '' }
}

function getSearchProp(searchTerm: string): string {
  return searchTerm.includes('@') ? 'applicationUser.Email' : 'fullName'
}

function buildPage(pageNumber: number, searchTerm: string, role: string): Page<string> {
  const filters: FilterMapping[] = []
  const normalizedSearch = searchTerm.trim()

  if (normalizedSearch) {
    filters.push(buildFilter(getSearchProp(normalizedSearch), normalizedSearch, FilterOperator.Contains, FilterType.Text))
  }

  if (role !== ALL_ROLES) {
    filters.push(buildFilter('applicationUser.UserRoles.FirstOrDefault().Role.Name', role, FilterOperator.Contains, FilterType.Text))
  }

  return { pageNumber, size: DEFAULT_PAGE_SIZE, totalElements: 0, orders: [], filter: filters, selected: [] }
}

export default function UserManagementPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isAdmin = user?.roles?.includes('Admin') ?? false

  useEffect(() => {
    if (!isAdmin) router.replace('/unauthorized')
  }, [isAdmin, router])

  const [pageNumber, setPageNumber] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPageNumber(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  const page = useMemo(() => buildPage(pageNumber, debouncedSearchTerm, roleFilter), [pageNumber, debouncedSearchTerm, roleFilter])

  const { data, isLoading, isError, refetch } = useGetAdminUsers(page)

  const users = data?.data ?? []
  const totalElements = data?.page.totalElements ?? 0
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE))

  function handleSearchChange(value: string) {
    setSearchTerm(value)
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value)
    setPageNumber(0)
  }

  if (!isAdmin) return null

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user roles, suspensions, and penalties</p>
        </div>
        {!isLoading && (
          <span className="badge-default shrink-0">{totalElements.toLocaleString()} users</span>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-default bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[33%] sm:min-w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search users by name or email..."
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter users by role">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All Roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Moderator">Moderator</SelectItem>
            <SelectItem value="Developer">Developer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="card p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Something went wrong. Try refreshing the page.</p>
          <button onClick={() => refetch()} className="btn-ghost">Retry</button>
        </div>
      ) : isLoading ? (
        <UsersTableSkeleton />
      ) : (
        <>
          <AdminUsersTable users={users} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {pageNumber + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={pageNumber <= 0}
                  className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNumber >= totalPages - 1}
                  className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
