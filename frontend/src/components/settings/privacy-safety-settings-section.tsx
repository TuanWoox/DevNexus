"use client";

import { useState } from "react";
import { Ban, Building2, ShieldAlert } from "lucide-react";

import { BlockedCommunitiesDialog } from "@/components/settings/blocked-communities-dialog";
import { BlockedProfilesDialog } from "@/components/settings/blocked-profiles-dialog";
import { Button } from "@/components/ui/button";

export function PrivacySafetySettingsSection() {
    const [blockedProfilesOpen, setBlockedProfilesOpen] = useState(false);
    const [blockedCommunitiesOpen, setBlockedCommunitiesOpen] = useState(false);

    return (
        <section className="space-y-5">
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
                    Safety controls
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    Review privacy and safety settings that control who can interact with you.
                </p>
            </div>

            <div className="card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                            <Ban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-foreground">Blocked profiles</h3>
                            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                Review profiles you have blocked and unblock them when needed.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full shrink-0 cursor-pointer sm:w-auto"
                        onClick={() => setBlockedProfilesOpen(true)}
                    >
                        Manage
                    </Button>
                </div>
            </div>

            <div className="card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-foreground">Blocked communities</h3>
                            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                Review communities you have blocked and unblock them when needed.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full shrink-0 cursor-pointer sm:w-auto"
                        onClick={() => setBlockedCommunitiesOpen(true)}
                    >
                        Manage
                    </Button>
                </div>
            </div>

            <BlockedProfilesDialog
                open={blockedProfilesOpen}
                onOpenChange={setBlockedProfilesOpen}
            />
            <BlockedCommunitiesDialog
                open={blockedCommunitiesOpen}
                onOpenChange={setBlockedCommunitiesOpen}
            />
        </section>
    );
}
