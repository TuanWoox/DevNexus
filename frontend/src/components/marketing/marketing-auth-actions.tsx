'use client'

import Link from 'next/link'
import { ArrowRight, LogIn, Rss, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { RootState } from '@/store/store'

type MarketingAuthActionsProps = {
    registerLabel?: string
    feedLabel?: string
    showRegisterIcon?: boolean
}

export function MarketingAuthActions({
    registerLabel = 'Create Account',
    feedLabel = 'Go to Feed',
    showRegisterIcon = false,
}: MarketingAuthActionsProps) {
    const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth)

    if (!isInitialized) {
        return null
    }

    if (isAuthenticated) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto btn-primary gap-2 h-12 px-8"
                >
                    <Link href="/feed">
                        <Rss className="h-4 w-4" />
                        {feedLabel}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
                asChild
                size="lg"
                className="w-full sm:w-auto btn-primary gap-2 h-12 px-8"
            >
                <Link href="/register">
                    {showRegisterIcon && <Users className="h-4 w-4" />}
                    {registerLabel}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>

            <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto btn-ghost gap-2 h-12 px-8"
            >
                <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    Sign In
                </Link>
            </Button>
        </div>
    )
}
