'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { useHasPassword } from '@/hooks/auth-hooks/use-has-password';
import { useChangePassword } from '@/hooks/auth-hooks/use-change-password';
import { useSetPassword } from '@/hooks/auth-hooks/use-set-password';
import { ChangePasswordDTO } from '@/types/account/change-password-dto';
import { SetPasswordDTO } from '@/types/account/set-password-dto';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function PasswordInput({ id, placeholder, register, ...rest }: any) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
                type={show ? 'text' : 'password'}
                id={id}
                placeholder={placeholder}
                className="input pl-9 pr-10 w-full"
                {...register}
                {...rest}
            />
            <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-heading transition-colors"
                tabIndex={-1}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const { data: hasPassword, isLoading: isCheckingPassword, refetch } = useHasPassword();
    const { mutate: changePassword, isPending: isChanging } = useChangePassword();
    const { mutate: setPassword, isPending: isSetting } = useSetPassword();

    const {
        register: regChange,
        handleSubmit: handleChange,
        formState: { errors: errChange },
        reset: resetChange,
        watch: watchChange,
    } = useForm<ChangePasswordDTO>();

    const {
        register: regSet,
        handleSubmit: handleSet,
        formState: { errors: errSet },
        reset: resetSet,
        watch: watchSet,
    } = useForm<SetPasswordDTO>();

    // Reset forms when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetChange();
            resetSet();
        }
    }, [isOpen, resetChange, resetSet]);

    const onSubmitChange = (data: ChangePasswordDTO) => {
        changePassword(data, {
            onSuccess: (result) => {
                if (result?.result) {
                    resetChange();
                    onClose();
                }
            },
        });
    };

    const onSubmitSet = (data: SetPasswordDTO) => {
        setPassword(data, {
            onSuccess: (result) => {
                if (result) {
                    resetSet();
                    refetch();
                    onClose();
                }
            },
        });
    };

    const newPassChange = watchChange('newPassword');
    const newPassSet = watchSet('newPassword');
    const isPending = isChanging || isSetting;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <KeyRound className="w-5 h-5 text-primary" />
                        {isCheckingPassword ? 'Security' : hasPassword ? 'Change Password' : 'Set Password'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCheckingPassword
                            ? 'Loading...'
                            : hasPassword
                                ? 'Update your password to keep your account secure.'
                                : 'Your account has no password yet (you signed in with OAuth). Set one to enable email login.'}
                    </DialogDescription>
                </DialogHeader>

                {isCheckingPassword ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : hasPassword ? (
                    /* ── Change Password form ── */
                    <form onSubmit={handleChange(onSubmitChange)} className="flex flex-col gap-4">
                        {/* Old Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="oldPassword" className="text-sm font-medium text-heading">
                                Current Password
                            </label>
                            <PasswordInput
                                id="oldPassword"
                                placeholder="Enter current password"
                                register={regChange('oldPassword', { required: 'Current password is required' })}
                            />
                            {errChange.oldPassword && (
                                <p className="text-xs text-destructive font-medium">{errChange.oldPassword.message}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="newPassword" className="text-sm font-medium text-heading">
                                New Password
                            </label>
                            <PasswordInput
                                id="newPassword"
                                placeholder="Enter new password"
                                register={regChange('newPassword', {
                                    required: 'New password is required',
                                    minLength: { value: 6, message: 'At least 6 characters' },
                                })}
                            />
                            {errChange.newPassword && (
                                <p className="text-xs text-destructive font-medium">{errChange.newPassword.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-heading">
                                Confirm New Password
                            </label>
                            <PasswordInput
                                id="confirmPassword"
                                placeholder="Repeat new password"
                                register={regChange('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (v: string) => v === newPassChange || 'Passwords do not match',
                                })}
                            />
                            {errChange.confirmPassword && (
                                <p className="text-xs text-destructive font-medium">{errChange.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <Button type="button" variant="custom" size="lg" className="btn-secondary" onClick={onClose} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" size="lg" className="btn-ai text-white gap-2" disabled={isPending}>
                                {isChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                {isChanging ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* ── Set Password form ── */
                    <form onSubmit={handleSet(onSubmitSet)} className="flex flex-col gap-4">
                        {/* New Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="setNewPassword" className="text-sm font-medium text-heading">
                                New Password
                            </label>
                            <PasswordInput
                                id="setNewPassword"
                                placeholder="Enter new password"
                                register={regSet('newPassword', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'At least 6 characters' },
                                })}
                            />
                            {errSet.newPassword && (
                                <p className="text-xs text-destructive font-medium">{errSet.newPassword.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="setConfirmPassword" className="text-sm font-medium text-heading">
                                Confirm Password
                            </label>
                            <PasswordInput
                                id="setConfirmPassword"
                                placeholder="Repeat password"
                                register={regSet('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (v: string) => v === newPassSet || 'Passwords do not match',
                                })}
                            />
                            {errSet.confirmPassword && (
                                <p className="text-xs text-destructive font-medium">{errSet.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <Button type="button" variant="custom" size="lg" className="btn-secondary" onClick={onClose} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" size="lg" className="btn-ai text-white gap-2" disabled={isPending}>
                                {isSetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                {isSetting ? 'Setting...' : 'Set Password'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
