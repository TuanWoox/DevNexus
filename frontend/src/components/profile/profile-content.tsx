"use client";

import { Lock } from "lucide-react";
import { ProfileOverviewList } from "@/components/profile/profile-overview-list";
import { ProfilePostList } from "@/components/profile/profile-post-list";
import { ProfileQAList } from "@/components/profile/profile-qa-list";

interface ProfileContentProps {
    activeTab: "overview" | "post" | "qa-post";
    targetProfileId: string;
    isOwnProfile: boolean;
    isPrivate: boolean;
    canViewContent: boolean;
}

export function ProfileContent({ activeTab, targetProfileId, isOwnProfile, isPrivate, canViewContent }: ProfileContentProps) {
    const isLockedPrivateProfile = !isOwnProfile && isPrivate && !canViewContent;

    return (
        <div className="max-w-5xl mx-auto w-full md:px-4">
            {activeTab === "overview" && (
                <div className="fade-in">
                    {isLockedPrivateProfile ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Lock className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-heading mt-2">This is a private profile</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
                                Follow to see posts.
                            </p>
                        </div>
                    ) : (
                        <ProfileOverviewList profileId={targetProfileId} />
                    )}
                </div>
            )}

            {canViewContent && activeTab === "post" && (
                <div className="fade-in">
                    <ProfilePostList profileId={targetProfileId} />
                </div>
            )}

            {canViewContent && activeTab === "qa-post" && (
                <div className="fade-in">
                    <ProfileQAList profileId={targetProfileId} />
                </div>
            )}
        </div>
    );
}
