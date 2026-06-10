'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import { GoogleLogin } from '@react-oauth/google';
import { Hexagon, Sparkles, Github, Lock, User, Eye, EyeOff } from 'lucide-react'
import useLogin from '@/hooks/auth-hooks/use-login';
import useGithubLogin from '@/hooks/auth-hooks/use-github-login';
import useGoogleLogin from '@/hooks/auth-hooks/use-google-login';
import { LoginAccountDTO } from '@/types/account/login-account-dto';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

function LoginContent() {
    const [showPassword, setShowPassword] = useState(false)

    const { login, isAuthenticating } = useLogin();
    const { login: githubLogin } = useGithubLogin();
    const { loginWithCredential, isPending: isGooglePending } = useGoogleLogin();
    const { resolvedTheme } = useTheme();
    const googleButtonTheme = resolvedTheme === "dark" ? "filled_black" : "outline";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginAccountDTO>({
        mode: "onChange",
        defaultValues: {
            username: "",
            password: "",
            rememberMe: false,
        },
    });

    const onSubmit = (data: LoginAccountDTO) => {
        login(data);
    };

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
                <button
                    type="button"
                    className="relative flex h-10 w-full items-center justify-center rounded border border-[#dadce0] dark:border-none bg-white px-3 text-sm text-[#3c4043] shadow-none transition-colors hover:bg-[rgba(66,133,244,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-70 dark:bg-[#202124] dark:text-[#e8eaed] dark:hover:bg-[rgba(255,255,255,.24)] cursor-pointer"
                    onClick={githubLogin}
                >
                    <div className="absolute left-0.5 flex h-9 w-9 min-w-9 items-center justify-center rounded-l-[3px] dark:bg-white text-[#24292f]">
                        <Github className="h-[18px] w-[18px]" />
                    </div>
                    <span className="ml-5 dark:ml-8">Continue with GitHub</span>
                </button>
                <div className={`h-10 w-full overflow-hidden rounded ${isGooglePending ? "pointer-events-none opacity-70" : ""}`}>
                    <GoogleLogin
                        key={googleButtonTheme}
                        onSuccess={loginWithCredential}
                        onError={() => toast.error("Google login failed.")}
                        useOneTap={false}
                        width="100%"
                        text="continue_with"
                        theme={googleButtonTheme}
                        shape="rectangular"
                        size="large"
                        logo_alignment="left"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-default" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-dimmed">
                        or continue with username
                    </span>
                </div>
            </div>

            {/* Form Input */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

                {/* Username */}
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
                            {...register("username", {
                                required: "Username is required",
                                minLength: {
                                    value: 3,
                                    message: "Must be at least 3 characters",
                                },
                                maxLength: {
                                    value: 30,
                                    message: "Must be at most 30 characters",
                                },
                            })}
                        />
                    </div>
                    {errors.username && <span className="text-xs text-destructive font-medium">{errors.username.message}</span>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5 mb-1">
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
                            type={showPassword ? "text" : "password"}
                            id="password"
                            className="input pl-9 pr-10"
                            placeholder="Password"
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
                    {errors.password && <span className="text-xs text-destructive font-medium">{errors.password.message}</span>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center mt-1 gap-1.5">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        className="h-4 w-4 rounded border cursor-pointer focus-ring transition-colors"
                        {...register("rememberMe")}
                    />
                    <label
                        htmlFor="rememberMe"
                        className="text-sm text-body cursor-pointer select-none"
                    >
                        Remember me
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn-ai w-full py-2.5 mt-2 text-base flex justify-center items-center gap-2"
                    disabled={isAuthenticating}
                >
                    <Sparkles className="h-4 w-4" />
                    {isAuthenticating ? 'Signing In...' : 'Sign In'}
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

export default LoginContent;
