import { Suspense } from 'react'
import LoginContent from '@/components/login/login-content';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}