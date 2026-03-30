'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, Sparkles, Mail, ArrowLeft, MailCheck, Loader2 } from 'lucide-react'
import useRequestResetPassword from '@/hooks/auth-hooks/use-request-reset-password';
import { useForm } from 'react-hook-form';

// Type cho Form Data
type ForgotPasswordForm = {
    email: string;
}

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { requestResetPassword, isLoading } = useRequestResetPassword();

    // Khởi tạo useForm
    const {
        register,
        handleSubmit,
        reset, // Dùng để clear form nếu cần
        formState: { errors }
    } = useForm<ForgotPasswordForm>({
        defaultValues: {
            email: ''
        }
    });

    // Hàm submit nhận data đã được validate từ useForm
    const onSubmit = (data: ForgotPasswordForm) => {
        requestResetPassword(data.email, {
            onSuccess: (res) => {
                if (res.result) {
                    setIsSubmitted(true);
                }
            }
        });
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

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-heading">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    id="email"
                                    className={`input pl-9 disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? 'border-destructive focus:ring-destructive' : ''
                                        }`}
                                    placeholder="you@example.com"
                                    disabled={isLoading}

                                    // Đăng ký input với useForm và thêm rules validation
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Please enter a valid email address"
                                        }
                                    })}
                                />
                            </div>

                            {errors.email && (
                                <span className="text-sm text-destructive mt-1">
                                    {errors.email.message}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-ai w-full py-2.5 mt-2 text-base flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
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
                        onClick={() => {
                            setIsSubmitted(false);
                            reset(); // gọi reset() từ useForm để reset data trg input
                        }}
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