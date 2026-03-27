'use client'

import Link from 'next/link'
import { Hexagon, Sparkles, Search } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

export function MobileHeader() {
    const { user } = useSelector((state: RootState) => state.auth)

    return (
        <header className="sm:hidden sticky top-0 h-14 bg-page/80 backdrop-blur-md border-b border-default flex items-center justify-between px-4 z-50">
            <Link href="/feed" className="flex items-center gap-2">
                <div className="relative">
                    <Hexagon className="h-7 w-7 animate-pulse text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 dark:text-emerald-400 text-emerald-500" />
                    </div>
                </div>
                <span className="font-bold text-heading">DevNexus</span>
            </Link>

            <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-primary transition-colors p-2">
                    <Search className="h-5 w-5" />
                </button>
                <button className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.userName?.charAt(0).toUpperCase() || 'U'}
                </button>
            </div>
        </header>
    )
}
