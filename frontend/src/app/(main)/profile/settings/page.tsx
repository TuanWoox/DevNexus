"use client"

import { ChangePasswordForm } from "./_components/change-password-form"

const ProfileSettingsPage = () => {
    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            
            <div className="grid gap-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Security</h2>
                    <ChangePasswordForm />
                </section>
                {/* Additional settings sections can be added here */}
            </div>
        </div>
    )
}

export default ProfileSettingsPage