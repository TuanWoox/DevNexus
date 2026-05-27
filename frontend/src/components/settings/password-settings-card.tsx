"use client";

import { useEffect, useState } from "react";
import { UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/auth-hooks/use-change-password";
import { useHasPassword } from "@/hooks/auth-hooks/use-has-password";
import { useSetPassword } from "@/hooks/auth-hooks/use-set-password";
import { ChangePasswordDTO } from "@/types/account/change-password-dto";
import { SetPasswordDTO } from "@/types/account/set-password-dto";
import { ReturnResult } from "@/types/common/return-result";

const passwordPolicy = {
    minLength: { value: 12, message: "Password must be at least 12 characters" },
    maxLength: { value: 128, message: "Password must be at most 128 characters" },
};

interface PasswordInputProps {
    id: string;
    placeholder: string;
    registration: UseFormRegisterReturn;
    autoComplete: string;
}

function PasswordInput({ id, placeholder, registration, autoComplete }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                id={id}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="pl-9 pr-10"
                {...registration}
            />
            <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export function PasswordSettingsCard() {
    const { data: hasPassword, isLoading: isCheckingPassword, refetch } = useHasPassword();
    const { mutate: changePassword, isPending: isChanging } = useChangePassword();
    const { mutate: setPassword, isPending: isSetting } = useSetPassword();

    const {
        register: registerChange,
        handleSubmit: handleSubmitChange,
        formState: { errors: errorsChange },
        reset: resetChange,
        control: controlChange,
    } = useForm<ChangePasswordDTO>();

    const {
        register: registerSet,
        handleSubmit: handleSubmitSet,
        formState: { errors: errorsSet },
        reset: resetSet,
        control: controlSet,
    } = useForm<SetPasswordDTO>();

    useEffect(() => {
        resetChange();
        resetSet();
    }, [hasPassword, resetChange, resetSet]);

    const newPasswordChange = useWatch({ control: controlChange, name: "newPassword" });
    const oldPasswordChange = useWatch({ control: controlChange, name: "oldPassword" });
    const newPasswordSet = useWatch({ control: controlSet, name: "newPassword" });

    const onSubmitChange = (payload: ChangePasswordDTO) => {
        changePassword(payload, {
            onSuccess: (result: ReturnResult<boolean>) => {
                if (result?.result === true) {
                    resetChange();
                }
            },
        });
    };

    const onSubmitSet = (payload: SetPasswordDTO) => {
        setPassword(payload, {
            onSuccess: (result: boolean) => {
                if (result === true) {
                    resetSet();
                    refetch();
                }
            },
        });
    };

    if (isCheckingPassword) {
        return (
            <Card className="card shadow-sm">
                <CardHeader className="border-b border-border/40 px-5 py-5">
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>Loading security configuration...</CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-48 items-center justify-center px-5 py-8">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="card shadow-sm">
            {hasPassword ? (
                <form onSubmit={handleSubmitChange(onSubmitChange)}>
                    <CardHeader className="border-b border-border/40 px-5 py-5">
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-5 py-5">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Current Password</Label>
                            <PasswordInput
                                id="oldPassword"
                                placeholder="Enter current password"
                                autoComplete="current-password"
                                registration={registerChange("oldPassword", {
                                    required: "Current password is required",
                                    ...passwordPolicy,
                                })}
                            />
                            {errorsChange.oldPassword && (
                                <p className="text-xs font-medium text-destructive">{errorsChange.oldPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <PasswordInput
                                id="newPassword"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                registration={registerChange("newPassword", {
                                    required: "New password is required",
                                    ...passwordPolicy,
                                    validate: (value) =>
                                        value !== oldPasswordChange || "New password must be different from current password",
                                })}
                            />
                            {errorsChange.newPassword && (
                                <p className="text-xs font-medium text-destructive">{errorsChange.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <PasswordInput
                                id="confirmPassword"
                                placeholder="Repeat new password"
                                autoComplete="new-password"
                                registration={registerChange("confirmPassword", {
                                    required: "Please confirm your password",
                                    ...passwordPolicy,
                                    validate: (value) => value === newPasswordChange || "Passwords do not match",
                                })}
                            />
                            {errorsChange.confirmPassword && (
                                <p className="text-xs font-medium text-destructive">{errorsChange.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-3 px-5 py-4">
                        <Button type="submit" className="btn-primary" disabled={isChanging}>
                            {isChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                            {isChanging ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            ) : (
                <form onSubmit={handleSubmitSet(onSubmitSet)}>
                    <CardHeader className="border-b border-border/40 px-5 py-5">
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Set Password
                        </CardTitle>
                        <CardDescription>
                            Your account currently does not have a password. Set one to enable email login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-5 py-5">
                        <div className="space-y-2">
                            <Label htmlFor="setNewPassword">New Password</Label>
                            <PasswordInput
                                id="setNewPassword"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                registration={registerSet("newPassword", {
                                    required: "Password is required",
                                    ...passwordPolicy,
                                })}
                            />
                            {errorsSet.newPassword && (
                                <p className="text-xs font-medium text-destructive">{errorsSet.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="setConfirmPassword">Confirm Password</Label>
                            <PasswordInput
                                id="setConfirmPassword"
                                placeholder="Repeat password"
                                autoComplete="new-password"
                                registration={registerSet("confirmPassword", {
                                    required: "Please confirm your password",
                                    ...passwordPolicy,
                                    validate: (value) => value === newPasswordSet || "Passwords do not match",
                                })}
                            />
                            {errorsSet.confirmPassword && (
                                <p className="text-xs font-medium text-destructive">{errorsSet.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-3 px-5 py-4">
                        <Button type="submit" className="btn-primary" disabled={isSetting}>
                            {isSetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                            {isSetting ? "Setting..." : "Set Password"}
                        </Button>
                    </CardFooter>
                </form>
            )}
        </Card>
    );
}
