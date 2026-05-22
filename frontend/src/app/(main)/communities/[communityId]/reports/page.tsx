"use client";

import React, { useEffect } from "react";
import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportsListContainer } from "@/components/communities/reports/reports-list-container";
import { toast } from "sonner";

const CommunityReportsPage = () => {
    const params = useParams();
    const communityId = params.communityId as string;
    const router = useRouter();

    const { data: community, isLoading: isCommunityLoading, isError } = useGetCommunityById(communityId);

    const role = community?.currentUserRole;
    const isMember = role === "MEMBER" || role === "MODERATOR" || role === "OWNER";

    useEffect(() => {
        if (!isCommunityLoading && role && !isMember) {
            toast.error("You must be a member of this community to view reports.");
            router.push(`/communities/${communityId}`);
        }
    }, [isCommunityLoading, role, isMember, router, communityId]);

    if (isCommunityLoading) {
        return (
            <div className="h-screen flex flex-col px-4 sm:px-6 lg:px-8 pt-6 pb-4 gap-5">
                <div className="flex items-center gap-4 shrink-0">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56 rounded-md" />
                        <Skeleton className="h-4 w-40 rounded-md" />
                    </div>
                </div>
                <div className="flex-1 rounded-xl border border-border overflow-hidden">
                    <div className="h-full grid xl:grid-cols-[280px_1fr]">
                        <Skeleton className="h-full rounded-none border-r border-border" />
                        <Skeleton className="h-full rounded-none" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !community || !isMember) {
        return (
            <div className="flex items-center justify-center h-screen bg-page">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                    <p className="text-sm text-muted-foreground">
                        You do not have permission to view this community&apos;s reports.
                    </p>
                </div>
            </div>
        );
    }

    return (
        /* Full-viewport layout — no page scroll, each panel scrolls independently */
        <div className="h-screen overflow-hidden bg-page flex flex-col relative">
            {/* Subtle depth gradient */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,hsl(var(--primary)/0.14),transparent)]"
            />

            {/* ── Page Header ── */}
            <header className="relative shrink-0 flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 border-b border-border/60 bg-card/60 backdrop-blur-sm">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg border border-border hover:bg-muted shadow-sm cursor-pointer shrink-0 transition-all duration-200"
                    onClick={() => router.push(`/communities/${communityId}`)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="space-y-0.5">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                        Community Reports
                    </h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        Reports for
                        <span className="font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                            c/{community.slug || community.id}
                        </span>
                    </p>
                </div>
            </header>

            {/* ── Main Content — fills remaining height ── */}
            <div className="relative flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-4">
                <div className="h-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <ReportsListContainer community={community} />
                </div>
            </div>
        </div>
    );
};

export default CommunityReportsPage;
