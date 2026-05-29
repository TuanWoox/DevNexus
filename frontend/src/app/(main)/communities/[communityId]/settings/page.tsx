"use client";

import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/communities/settings/general-settings";
import { RequestsManagement } from "@/components/communities/settings/requests-management";
import { ModeratorsManagement } from "@/components/communities/settings/moderators-management";
import { BansManagement } from "@/components/communities/settings/bans-management";
import { MutesManagement } from "@/components/communities/settings/mutes-management";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings, Users, Settings2, ShieldCheck, ShieldAlert, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

const CommunitySettingsPage = () => {
    const params = useParams();
    const communityId = params.communityId as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const { data: community, isLoading: isCommunityLoading, isError } = useGetCommunityById(communityId);

    const role = community?.currentUserRole;
    const isOwner = role === "OWNER";
    const isModerator = role === "MODERATOR";
    const hasAccess = isOwner || isModerator;

    const validTabs = isOwner ? ["general", "requests", "moderators", "bans", "mutes"] : ["requests", "bans", "mutes"];
    const activeTab = validTabs.includes(tabParam || "")
        ? tabParam as string
        : (isOwner ? "general" : "requests");

    const handleTabChange = (val: string) => {
        router.replace(`/communities/${communityId}/settings?tab=${val}`, { scroll: false });
    };

    // Guard: redirect if neither owner nor moderator once data is loaded
    useEffect(() => {
        if (!isCommunityLoading && role && !hasAccess) {
            toast.error("You do not have permission to access community settings.");
            router.push(`/communities/${communityId}`);
        }
    }, [isCommunityLoading, role, hasAccess, router, communityId]);

    // Guard: redirect if moderator tries to access owner-only tabs
    useEffect(() => {
        if (!isCommunityLoading && isModerator && tabParam) {
            if (tabParam === "general" || tabParam === "moderators") {
                toast.error("You do not have permission to access this tab.");
                router.replace(`/communities/${communityId}/settings?tab=requests`, { scroll: false });
            }
        }
    }, [isCommunityLoading, isModerator, tabParam, router, communityId]);

    if (isCommunityLoading) {
        return (
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="flex flex-col gap-8">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-100 flex-1 rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !community || !hasAccess) return null;

    return (
        <div className="min-h-dvh bg-page pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
                {/* Header Section */}
                <div className="flex items-center gap-4 border-b border-border/30 pb-6">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full shadow-sm hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                        onClick={() => router.push(`/communities/${communityId}`)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
                            <Settings className="h-7 w-7 text-primary" />
                            Community Settings
                        </h1>
                        <p className="text-base text-muted-foreground mt-1 flex items-center gap-2">
                            Manage configurations for <span className="font-mono font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md text-base border border-primary/10">c/{community.slug || community.id}</span>
                        </p>
                    </div>
                </div>

                {/* Master Settings Card Container */}
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="bg-card border-2 border-border rounded-2xl shadow-2xl flex flex-col lg:flex-row min-h-[calc(100dvh-240px)] transition-all duration-300 w-full lg:min-w-[1152px] lg:max-w-6xl mx-auto"
                >
                    {/* Left Column: Navigation Sidebar */}
                    <div className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-muted/40 p-7 flex-col gap-2">
                        <div className="pb-4 mb-2 border-b border-border/40">
                            <h3 className="text-base font-bold text-muted-foreground uppercase tracking-wider">Settings Menu</h3>
                            <p className="text-sm text-muted-foreground/80 mt-0.5">Configure your community space</p>
                        </div>

                        <TabsList className="flex flex-col justify-start h-auto bg-transparent p-0 w-full gap-1.5 shrink-0">
                            {/* Owner-only tabs */}
                            {isOwner && (
                                <TabsTrigger
                                    value="general"
                                    className="w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left rounded-xl hover:bg-primary/5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200 ease-out border border-transparent data-[state=active]:border-primary/10 text-base whitespace-nowrap cursor-pointer active:scale-[0.98]"
                                >
                                    <Settings2 className="h-4 w-4 shrink-0" />
                                    General Settings
                                </TabsTrigger>
                            )}

                            <TabsTrigger
                                value="requests"
                                className="w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left rounded-xl hover:bg-primary/5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200 ease-out border border-transparent data-[state=active]:border-primary/10 text-base whitespace-nowrap cursor-pointer active:scale-[0.98]"
                            >
                                <Users className="h-4 w-4 shrink-0" />
                                Membership Requests
                            </TabsTrigger>

                            {/* Owner-only tabs */}
                            {isOwner && (
                                <TabsTrigger
                                    value="moderators"
                                    className="w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left rounded-xl hover:bg-primary/5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200 ease-out border border-transparent data-[state=active]:border-primary/10 text-base whitespace-nowrap cursor-pointer active:scale-[0.98]"
                                >
                                    <ShieldCheck className="h-4 w-4 shrink-0" />
                                    Moderators
                                </TabsTrigger>
                            )}

                            <TabsTrigger
                                value="bans"
                                className="w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left rounded-xl hover:bg-red-500/5 hover:text-red-600 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200 ease-out border border-transparent data-[state=active]:border-red-500/10 text-base whitespace-nowrap cursor-pointer active:scale-[0.98]"
                            >
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                Ban List
                            </TabsTrigger>

                            <TabsTrigger
                                value="mutes"
                                className="w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left rounded-xl hover:bg-amber-500/5 hover:text-amber-600 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200 ease-out border border-transparent data-[state=active]:border-amber-500/10 text-base whitespace-nowrap cursor-pointer active:scale-[0.98]"
                            >
                                <VolumeX className="h-4 w-4 shrink-0" />
                                Mutes List
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Right Column: Settings Content */}
                    <div className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 relative">
                        {/* Subtle gradient background effect for card */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />

                        {/* Mobile & Tablet Tab Selector (Hidden on desktop) */}
                        <div className="block lg:hidden w-full mb-6">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                Settings Section
                            </label>
                            <Select value={activeTab} onValueChange={handleTabChange}>
                                <SelectTrigger className="w-full h-11 rounded-xl border border-border bg-background px-3 shadow-sm focus:ring-primary/20 cursor-pointer">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                                    {isOwner && (
                                        <SelectItem value="general" className="flex items-center text-sm font-semibold gap-3 p-2.5 hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer">
                                            General Settings
                                        </SelectItem>
                                    )}
                                    <SelectItem value="requests" className="flex items-center text-sm font-semibold gap-3 p-2.5 hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer">
                                        Membership Requests
                                    </SelectItem>
                                    {isOwner && (
                                        <SelectItem value="moderators" className="flex items-center text-sm font-semibold gap-3 p-2.5 hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer">
                                            Moderators
                                        </SelectItem>
                                    )}
                                    <SelectItem value="bans" className="flex items-center text-sm font-semibold gap-3 p-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-500/5">
                                        Ban List
                                    </SelectItem>
                                    <SelectItem value="mutes" className="flex items-center text-sm font-semibold gap-3 p-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-500/5">
                                        Mutes List
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isOwner && (
                            <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="mb-6 border-b border-border/30 pb-4">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">General Information</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Update your community's identity and privacy configurations.</p>
                                </div>
                                <GeneralSettings community={community} />
                            </TabsContent>
                        )}

                        <TabsContent value="requests" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <div className="mb-6 border-b border-border/30 pb-4">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    Pending Requests
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">Review, approve, or reject user requests to join your private community.</p>
                            </div>
                            <RequestsManagement community={community} />
                        </TabsContent>

                        {isOwner && (
                            <TabsContent value="moderators" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="mb-6 border-b border-border/30 pb-4">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                        Moderators Management
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">Manage users who have administrative access to this community.</p>
                                </div>
                                <ModeratorsManagement community={community} />
                            </TabsContent>
                        )}

                        <TabsContent value="bans" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <div className="mb-6 border-b border-border/30 pb-4">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                                    Ban List
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">Manage users who have been permanently banned from accessing this community.</p>
                            </div>
                            <BansManagement community={community} />
                        </TabsContent>

                        <TabsContent value="mutes" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <div className="mb-6 border-b border-border/30 pb-4">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-600 flex items-center gap-2">
                                    Mutes List
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">Manage users who have been muted and restricted from posting or commenting.</p>
                            </div>
                            <MutesManagement community={community} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default CommunitySettingsPage;