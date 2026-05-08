"use client";

import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/communities/settings/general-settings";
import { RequestsManagement } from "@/components/communities/settings/requests-management";
import { ModeratorsManagement } from "@/components/communities/settings/moderators-management";
import { BansManagement } from "@/components/communities/settings/bans-management";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings, Users, Settings2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

const CommunitySettingsPage = () => {
    const params = useParams();
    const communityId = params.communityId as string;
    const router = useRouter();

    const { data: community, isLoading: isCommunityLoading, isError } = useGetCommunityById(communityId);

    const role = community?.currentUserRole;
    const isOwner = role === "OWNER";
    const isModerator = role === "MODERATOR";
    const hasAccess = isOwner || isModerator;

    // Guard: redirect if neither owner nor moderator once data is loaded
    useEffect(() => {
        if (!isCommunityLoading && role && !hasAccess) {
            toast.error("You do not have permission to access community settings.");
            router.push(`/communities/${communityId}`);
        }
    }, [isCommunityLoading, role, hasAccess, router, communityId]);

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
        <div className="min-h-screen bg-page pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full shadow-sm hover:bg-muted"
                        onClick={() => router.push(`/communities/${communityId}`)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 tracking-tight">
                            <Settings className="h-7 w-7 text-primary" />
                            Community Settings
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
                            Manage configurations for <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded-md text-sm">c/{community.slug || community.id}</span>
                        </p>
                    </div>
                </div>

                {/* Main Content Layout */}
                <Tabs defaultValue={isOwner ? "general" : "requests"} className="flex flex-col gap-8 fade-in">

                    {/* Tab List — owner sees all 4, moderator only sees Requests + Bans */}
                    <div className="border-b">
                        <TabsList className="flex flex-row justify-start h-auto bg-transparent p-0 w-full gap-2 overflow-x-auto pb-4 shrink-0 no-scrollbar">

                            {/* Owner-only tabs */}
                            {isOwner && (
                                <TabsTrigger
                                    value="general"
                                    className="w-max shrink-0 flex items-center gap-3 justify-start px-4 py-2.5 text-left rounded-lg hover:bg-primary/10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-colors dark:data-[state=active]:text-primary whitespace-nowrap"
                                >
                                    <Settings2 className="h-4 w-4" />
                                    General Settings
                                </TabsTrigger>
                            )}

                            <TabsTrigger
                                value="requests"
                                className="w-max shrink-0 flex items-center gap-3 justify-start px-4 py-2.5 text-left rounded-lg hover:bg-primary/10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-colors dark:data-[state=active]:text-primary whitespace-nowrap"
                            >
                                <Users className="h-4 w-4" />
                                Membership Requests
                            </TabsTrigger>

                            {/* Owner-only tabs */}
                            {isOwner && (
                                <TabsTrigger
                                    value="moderators"
                                    className="w-max shrink-0 flex items-center gap-3 justify-start px-4 py-2.5 text-left rounded-lg hover:bg-primary/10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-colors dark:data-[state=active]:text-primary whitespace-nowrap"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Moderators
                                </TabsTrigger>
                            )}

                            <TabsTrigger
                                value="bans"
                                className="w-max shrink-0 flex items-center gap-3 justify-start px-4 py-2.5 text-left rounded-lg hover:bg-red-500/10 hover:text-red-600 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-none transition-colors whitespace-nowrap"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Ban List
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab Content Areas */}
                    <div className="flex-1">
                        <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                            {/* Subtle gradient background effect for card */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />

                            {isOwner && (
                                <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    <div className="mb-8 border-b pb-4">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">General Information</h2>
                                        <p className="text-sm sm:text-base text-muted-foreground mt-1">Update your community's identity and privacy configurations.</p>
                                    </div>
                                    <GeneralSettings community={community} />
                                </TabsContent>
                            )}

                            <TabsContent value="requests" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="mb-8 border-b pb-4">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                        Pending Requests
                                    </h2>
                                    <p className="text-sm sm:text-base text-muted-foreground mt-1">Review, approve, or reject user requests to join your private community.</p>
                                </div>
                                <RequestsManagement community={community} />
                            </TabsContent>

                            {isOwner && (
                                <TabsContent value="moderators" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    <div className="mb-8 border-b pb-4">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                            Moderators Management
                                        </h2>
                                        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage users who have administrative access to this community.</p>
                                    </div>
                                    <ModeratorsManagement community={community} />
                                </TabsContent>
                            )}

                            <TabsContent value="bans" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="mb-8 border-b pb-4">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                                        Ban List
                                    </h2>
                                    <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage users who have been permanently banned from accessing this community.</p>
                                </div>
                                <BansManagement community={community} />
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default CommunitySettingsPage;