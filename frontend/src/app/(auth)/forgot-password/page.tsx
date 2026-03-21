'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Key, Sparkles, Mail, ArrowLeft, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Ở đây bạn sẽ gọi API gửi request lên server
        // Sau khi gọi thành công thì set state để đổi UI
        setIsSubmitted(true)
    }

    return (
        <div className="card p-8 sm:p-10 max-w-md w-full shadow-elevated z-10 relative mx-auto">

            {!isSubmitted ? (
                // GIAO DIỆN 1: KHI CHƯA SUBMIT
                <>
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                            <Key className="h-12 w-12 text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-heading text-center">
                            Reset your password
                        </h1>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                            Enter your email address and we&apos;ll send you a link to reset your password
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-heading">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    id="email"
                                    className="input pl-9"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-ai w-full py-2.5 mt-2 text-base">
                            Send Reset Link
                        </button>
                    </form>
                </>
            ) : (
                // GIAO DIỆN 2: KHI ĐÃ SUBMIT
                <div className="flex flex-col items-center py-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <MailCheck className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading text-center mb-2">
                        Check your email
                    </h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        We have sent a password reset link to your email.
                    </p>

                    {/* Nút phụ để phòng trường hợp user gõ sai email và muốn nhập lại */}
                    <button
                        onClick={() => setIsSubmitted(false)}
                        className="btn-ghost w-full py-2.5"
                    >
                        Try another email
                    </button>
                </div>
            )}

            {/* Shared Footer Card: Nút quay lại Login */}
            <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 mt-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
            </Link>

        </div>
    )
}