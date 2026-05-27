"use client";

import { PasswordSettingsCard } from "@/components/settings/password-settings-card";

export function SecuritySettingsSection() {
    return (
        <section className="space-y-5">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <h3 className="text-base font-semibold text-foreground">Account access</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Update your password and protect access to your DevNexus account.
                </p>
            </div>

            <div className="">
                <PasswordSettingsCard />
            </div>
        </section>
    );
}
