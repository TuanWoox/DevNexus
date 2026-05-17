"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2, KeyRound } from "lucide-react"

import { useHasPassword } from "@/hooks/auth-hooks/use-has-password"
import { useChangePassword } from "@/hooks/auth-hooks/use-change-password"
import { useSetPassword } from "@/hooks/auth-hooks/use-set-password"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChangePasswordDTO } from "@/types/account/change-password-dto"
import { SetPasswordDTO } from "@/types/account/set-password-dto"

export const ChangePasswordForm = () => {
    const { data: hasPassword, isLoading: isCheckingPassword, refetch } = useHasPassword()
    const { mutate: changePassword, isPending: isChanging } = useChangePassword()
    const { mutate: setPassword, isPending: isSetting } = useSetPassword()

    const {
        register: registerChange,
        handleSubmit: handleSubmitChange,
        formState: { errors: errorsChange },
        reset: resetChange,
        watch: watchChange
    } = useForm<ChangePasswordDTO>()

    const {
        register: registerSet,
        handleSubmit: handleSubmitSet,
        formState: { errors: errorsSet },
        reset: resetSet,
        watch: watchSet
    } = useForm<SetPasswordDTO>()

    const onSubmitChange = (data: ChangePasswordDTO) => {
        changePassword(data, {
            onSuccess: () => {
                resetChange()
            }
        })
    }

    const onSubmitSet = (data: SetPasswordDTO) => {
        setPassword(data, {
            onSuccess: () => {
                resetSet()
                refetch() // Refresh hasPassword state so UI switches to "Change Password" mode
            }
        })
    }

    if (isCheckingPassword) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-muted-foreground" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>Loading security configuration...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    // New Password and Confirm Password validation logic to ensure they match
    const newPasswordChange = watchChange("newPassword")
    const newPasswordSet = watchSet("newPassword")

    return (
        <Card className="w-full max-w-md border-border/70 shadow-sm">
            {hasPassword ? (
                <form onSubmit={handleSubmitChange(onSubmitChange)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Current Password</Label>
                            <Input
                                id="oldPassword"
                                type="password"
                                placeholder="Enter current password"
                                {...registerChange("oldPassword", { required: "Current password is required" })}
                            />
                            {errorsChange.oldPassword && (
                                <p className="text-xs text-destructive mt-1">{errorsChange.oldPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                {...registerChange("newPassword", {
                                    required: "New password is required",
                                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                                })}
                            />
                            {errorsChange.newPassword && (
                                <p className="text-xs text-destructive mt-1">{errorsChange.newPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                {...registerChange("confirmPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) => value === newPasswordChange || "Passwords do not match"
                                })}
                            />
                            {errorsChange.confirmPassword && (
                                <p className="text-xs text-destructive mt-1">{errorsChange.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isChanging} className="w-full">
                            {isChanging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isChanging ? "Changing Password..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            ) : (
                <form onSubmit={handleSubmitSet(onSubmitSet)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Set Password
                        </CardTitle>
                        <CardDescription>
                            Your account currently does not have a password. Set one now to enable email login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="setNewPassword">New Password</Label>
                            <Input
                                id="setNewPassword"
                                type="password"
                                placeholder="Enter new password"
                                {...registerSet("newPassword", {
                                    required: "New password is required",
                                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                                })}
                            />
                            {errorsSet.newPassword && (
                                <p className="text-xs text-destructive mt-1">{errorsSet.newPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="setConfirmPassword">Confirm Password</Label>
                            <Input
                                id="setConfirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                {...registerSet("confirmPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) => value === newPasswordSet || "Passwords do not match"
                                })}
                            />
                            {errorsSet.confirmPassword && (
                                <p className="text-xs text-destructive mt-1">{errorsSet.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSetting} className="w-full">
                            {isSetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isSetting ? "Setting Password..." : "Set Password"}
                        </Button>
                    </CardFooter>
                </form>
            )}
        </Card>
    )
}
