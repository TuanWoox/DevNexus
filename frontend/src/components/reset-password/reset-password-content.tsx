'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import useResetPassword from '@/hooks/use-reset-password'
import { ResetPasswordDTO } from '@/types/account/reset-password-dto'

type ResetPasswordForm = {
    password: string;
    confirmPassword: string;
}

// Tách riêng form ra một component con để dùng được hook useSearchParams an toàn
function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);


    // Tự động giải mã (decode) các ký tự đặc biệt (%40 -> @, %2F -> /)
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const { resetPassword, isLoading } = useResetPassword();

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors }
    } = useForm<ResetPasswordForm>();

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!email || !token) {
            alert("Invalid reset link. Missing email or token.");
            return;
        }

        const payload: ResetPasswordDTO = {
            email,
            token,
            newPassword: data.password
        };

        console.log("Submitting payload:", payload);

        resetPassword(payload, {
            onSuccess: () => router.push('/login')
        })
    }

    // Nếu user vào thẳng link /reset-password mà không có token/email
    if (!email || !token) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-destructive">Invalid Link</h2>
                <p className="text-muted-foreground mt-2">The password reset link is invalid or has expired.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-heading">New Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type={showPassword ? "text" : "password"}
                        className={`input pl-9 ${errors.password ? 'border-destructive focus:ring-destructive' : ''}`}
                        placeholder="Enter new password"
                        disabled={isLoading}
                        {...register("password", {
                            required: "Password is required",
                            minLength: {
                                value: 12,
                                message: "Must be at least 12 characters",
                            },
                            maxLength: {
                                value: 128,
                                message: "Must be at most 128 characters",
                            },
                        })}
                    />
                    {/* NÚT SHOW/HIDE PASSWORD */}
                    <button
                        type="button"
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
                {errors.password && <span className="text-sm text-destructive">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-heading">Confirm Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type={showConfirm ? "text" : "password"}
                        className={`input pl-9 ${errors.confirmPassword ? 'border-destructive focus:ring-destructive' : ''}`}
                        placeholder="Confirm new password"
                        disabled={isLoading}
                        {...register("confirmPassword", {
                            required: "Please confirm your password",
                            validate: (val: string) => {
                                // Lấy giá trị của trường password để so sánh
                                if (getValues('password') != val) {
                                    return "Your passwords do no match";
                                }
                            }
                        })}
                    />
                    {/* NÚT SHOW/HIDE PASSWORD */}
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-heading transition-colors"
                    >
                        {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.confirmPassword && <span className="text-sm text-destructive">{errors.confirmPassword.message}</span>}
            </div>

            <button
                type="submit"
                className="btn-ai w-full py-2.5 mt-2 flex justify-center items-center gap-2 text-base"
                disabled={isLoading}
            >
                {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Updating...</> : "Update Password"}
            </button>
        </form>
    )
}

export default ResetPasswordContent;