'use client' // BẮT BUỘC: Thêm dòng này để dùng được useState

import { useState } from 'react' // Import useState
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
// Import thêm Eye và EyeOff để làm nút show/hide password
import { Hexagon, Sparkles, Github, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    // State quản lý ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="card p-8 sm:p-10 max-w-md w-full shadow-elevated z-10 relative">

            {/* Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                    <Hexagon className="h-12 w-12 text-primary animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-heading text-center">
                    Welcome back
                </h1>
                <p className="text-sm text-muted-foreground text-center mt-2">
                    Log in to continue your AI-enhanced learning journey
                </p>
            </div>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-3 mb-6">
                <button className="btn-ghost w-full">
                    <Github className="h-4 w-4" />
                    Continue with GitHub
                </button>
                <button className="btn-ghost w-full">
                    <Mail className="h-4 w-4" />
                    Continue with Google
                </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-dimmed">
                        or continue with email
                    </span>
                </div>
            </div>

            {/* Form Input */}
            <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="username" className="text-sm font-medium text-heading">
                        Username
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            id="username"
                            className="input pl-9"
                            placeholder="Username or Email"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-heading">
                            Password
                        </label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:opacity-80">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            // FIX TOGGLE: Đổi type dựa theo state
                            type={showPassword ? "text" : "password"}
                            id="password"
                            // Thêm pr-10 để text không đè lên cái icon hình con mắt
                            className="input pl-9 pr-10"
                            placeholder="••••••••"
                            required
                        />

                        {/* NÚT SHOW/HIDE PASSWORD */}
                        <button
                            type="button" // Rất quan trọng: Tránh form bị submit khi click
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-heading transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn-ai w-full py-2.5 mt-2 text-lg">
                    <Sparkles className="h-4 w-4" />
                    Sign In
                </button>
            </form>

            {/* Footer Form */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary font-medium hover:opacity-80 transition-opacity">
                    Sign up
                </Link>
            </div>

        </div>
    )
}