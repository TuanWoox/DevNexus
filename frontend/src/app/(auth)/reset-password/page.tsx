import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ResetPasswordContent from '@/components/reset-password/reset-password-content'

export default function ResetPasswordPage() {
    return (
        <div className="card p-8 sm:p-10 max-w-md w-full shadow-elevated z-10 relative mx-auto">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-heading">Set New Password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Please enter your new password below.
                </p>
            </div>

            {/* Phải bọc trong Suspense vì có dùng useSearchParams */}
            <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>}>
                <ResetPasswordContent></ResetPasswordContent>
            </Suspense>
        </div>
    )
}