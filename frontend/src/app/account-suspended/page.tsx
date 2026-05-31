"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Ban, LogIn, Mail } from "lucide-react";
import type { AccountModerationStatus } from "@/types/common/return-result";

function readStoredModerationStatus(): AccountModerationStatus | null {
    if (typeof window === "undefined") return null;

    const rawStatus = window.sessionStorage.getItem("accountModerationStatus");
    if (!rawStatus) return null;

    try {
        return JSON.parse(rawStatus) as AccountModerationStatus;
    } catch {
        window.sessionStorage.removeItem("accountModerationStatus");
        return null;
    }
}

function formatSuspendedUntil(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AccountSuspendedPage() {
    const [status] = useState<AccountModerationStatus | null>(readStoredModerationStatus);

    const suspendedUntil = formatSuspendedUntil(status?.suspendedUntil);
    const isPermanent = status?.isPermanentBan === true;
    const hasKnownDuration = isPermanent || Boolean(suspendedUntil);
    const headline = isPermanent
        ? "Your account is permanently suspended"
        : suspendedUntil
            ? "Your account is temporarily suspended"
            : "Your account is suspended";

    return (
        <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-16">
                <section className="w-full max-w-2xl text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
                        <Ban className="h-8 w-8" />
                    </div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-destructive">
                        Account restricted
                    </p>
                    <h1 className="text-3xl font-bold text-heading sm:text-4xl">
                        {headline}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base text-body">
                        You cannot access DevNexus while this account restriction is active.
                    </p>

                    <div className="mt-8 rounded-lg border bg-card p-5 text-left">
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                                <dd className="mt-1 text-base font-semibold text-heading">
                                    {hasKnownDuration
                                        ? isPermanent ? "Permanent suspension" : "Temporary suspension"
                                        : "Suspension active"}
                                </dd>
                            </div>
                            {!isPermanent && suspendedUntil && (
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Suspended until</dt>
                                    <dd className="mt-1 text-base text-heading">{suspendedUntil}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Reason</dt>
                                <dd className="mt-1 text-base text-heading">
                                    {status?.reason || "A platform moderator restricted this account after reviewing activity."}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-5 rounded-lg border bg-muted/30 p-5 text-left">
                        <h2 className="text-base font-semibold text-heading">Need help?</h2>
                        <p className="mt-2 text-sm text-body">
                            If you believe this action was made by mistake or you need more information, please contact support.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link href="/login" className="btn-primary gap-2 w-full sm:w-auto">
                            <LogIn className="h-4 w-4" />
                            Back to login
                        </Link>
                        <Link href="mailto:support@devnexus.local" className="btn-ghost gap-2 w-full sm:w-auto">
                            <Mail className="h-4 w-4" />
                            Contact support
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
