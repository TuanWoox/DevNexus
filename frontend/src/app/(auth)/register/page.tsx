'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import {
    Sparkles,
    UserPlus,
    Mail,
    Lock,
    User,
    UserCircle,
    Code,
    X
} from 'lucide-react'
import { RegisterAccountDTO } from '@/types/account/register-account-dto'
import useRegister from '@/hooks/use-register'

export default function RegisterPage() {

    const { registerFn, isLoading } = useRegister();

    // 2. Khởi tạo useForm
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors } // Lấy object errors để hiển thị lỗi
    } = useForm<RegisterAccountDTO>({
        defaultValues: {
            userName: '',
            password: '',
            email: '',
            onBoardInformation: {
                fullName: '',
                bio: '',
                techStacks: []
            }
        }
    })

    // State phụ để quản lý ô input lúc user đang gõ tech stack
    const [techInput, setTechInput] = useState('')

    // Theo dõi mảng techStacks từ react-hook-form để render UI
    const techStacks = watch('onBoardInformation.techStacks') || []

    // Xử lý thêm Tech Stack
    const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const newTech = techInput.trim()
            if (newTech && !techStacks.includes(newTech)) {
                setValue('onBoardInformation.techStacks', [...techStacks, newTech])
                setTechInput('')
            }
        }
    }

    // Xử lý xóa Tech Stack
    const handleRemoveTech = (techToRemove: string) => {
        setValue('onBoardInformation.techStacks', techStacks.filter(tech => tech !== techToRemove))
    }

    // 3. Hàm xử lý Submit (đã được bọc bởi handleSubmit của react-hook-form)
    const onSubmit = (data: RegisterAccountDTO) => {
        console.log('Register Payload:', data)
        // Gọi API gửi payload (data) lên server ở đây...
        registerFn(data);
    }

    return (
        <>
            {/* Form Card (Bản rộng max-w-2xl) */}
            <div className="card p-8 sm:p-10 max-w-2xl w-full shadow-elevated z-10 relative">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <UserPlus className="h-12 w-12 text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-emerald-500 -ml-8 -mt-6" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-heading text-center">
                        Join DevNexus
                    </h1>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                        Start your AI-enhanced learning journey today
                    </p>
                </div>

                {/* Form Layout Grid */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Hàng 1: Username & Full Name */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="userName" className="text-sm font-medium text-heading">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    id="userName"
                                    // Đổi border thành đỏ nếu có lỗi
                                    className={`input pl-9 ${errors.userName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="e.g. jdoe99"
                                    {...register('userName', {
                                        required: 'Username is required',
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
                            {/* Hiển thị lỗi */}
                            {errors.userName && (
                                <p className="text-xs text-destructive font-medium">{errors.userName.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="fullName" className="text-sm font-medium text-heading">
                                Full Name
                            </label>
                            <div className="relative">
                                <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    id="fullName"
                                    className={`input pl-9 ${errors.onBoardInformation?.fullName ? 'border-red-500' : ''}`}
                                    placeholder="John Doe"
                                    {...register('onBoardInformation.fullName', {
                                        required: 'Full name is required'
                                    })}
                                />
                            </div>
                            {/* Chú ý cách truy cập lỗi lồng nhau (nested errors) */}
                            {errors.onBoardInformation?.fullName && (
                                <p className="text-xs text-destructive font-medium">{errors.onBoardInformation.fullName.message}</p>
                            )}
                        </div>

                        {/* Hàng 2: Email & Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-heading">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    id="email"
                                    className={`input pl-9 ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="you@example.com"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-heading">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    id="password"
                                    className={`input pl-9 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    {...register('password', {
                                        required: 'Password is required',
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
                            </div>
                            {errors.password && (
                                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Hàng 3: Bio */}
                        <div className="flex flex-col gap-1.5 col-span-full">
                            <label htmlFor="bio" className="text-sm font-medium text-heading">
                                Bio
                                {/* <span className="text-muted-foreground font-normal">(Optional)</span> */}
                            </label>
                            <textarea
                                id="bio"
                                className="input min-h-25 resize-y"
                                placeholder="Tell us a bit about yourself..."
                                {...register('onBoardInformation.bio')}
                            />
                        </div>

                        {/* Hàng 4: Tech Stacks */}
                        <div className="flex flex-col gap-1.5 col-span-full">
                            <label htmlFor="techInput" className="text-sm font-medium text-heading">
                                Tech Stacks
                                {/* <span className="text-muted-foreground font-normal">(Optional)</span> */}
                            </label>
                            <div className="relative">
                                <Code className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    id="techInput"
                                    value={techInput}
                                    onChange={(e) => setTechInput(e.target.value)}
                                    onKeyDown={handleAddTech}
                                    className="input pl-9"
                                    placeholder="e.g. React, Node.js (Press Enter to add)"
                                />
                            </div>

                            {/* Hiển thị danh sách Tags */}
                            {techStacks.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {techStacks.map((tech) => (
                                        <span
                                            key={tech}
                                            className="badge-default flex items-center gap-1.5 py-1 px-2.5"
                                        >
                                            {tech}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTech(tech)}
                                                className="hover:text-destructive transition-colors focus:outline-none cursor-pointer"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-4 flex">
                        <button
                            type="submit"
                            className="btn-ai w-full py-2.5 text-base"
                            disabled={isLoading}
                        >
                            <Sparkles className="h-4 w-4" />
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-medium hover:opacity-80 transition-opacity">
                        Sign in
                    </Link>
                </div>

            </div>
        </>
    );
}