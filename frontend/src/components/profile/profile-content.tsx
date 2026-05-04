"use client";

import { Lock } from "lucide-react";
import { ProfileOverviewList } from "@/components/profile/profile-overview-list";
import { ProfilePostList } from "@/components/profile/profile-post-list";
import { ProfileQAList } from "@/components/profile/profile-qa-list";

interface ProfileContentProps {
    activeTab: "overview" | "post" | "qa-post" | "saved";
    targetProfileId: string;
    isOwnProfile: boolean;
    isPrivate: boolean;
    fullName: string;
}

export function ProfileContent({ activeTab, targetProfileId, isOwnProfile, isPrivate, fullName }: ProfileContentProps) {
    const isPrivateAndNotOwner = !isOwnProfile && isPrivate;

    return (
        <div className="max-w-5xl mx-auto w-full md:px-4">
            {activeTab === "overview" && (
                <div className="fade-in">
                    {isPrivateAndNotOwner ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Lock className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-heading mt-2">This account is private</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
                                You are only allowed to view basic information about this profile.
                            </p>
                        </div>
                    ) : (
                        <ProfileOverviewList profileId={targetProfileId} />
                    )}
                </div>
            )}

            {!isPrivateAndNotOwner && activeTab === "post" && (
                <div className="fade-in">
                    <ProfilePostList profileId={targetProfileId} />
                </div>
            )}

            {!isPrivateAndNotOwner && activeTab === "qa-post" && (
                <div className="fade-in">
                    <ProfileQAList profileId={targetProfileId} />
                </div>
            )}

            {isOwnProfile && activeTab === "saved" && (
                <div className="fade-in">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <span className="text-3xl">🔖</span>
                        </div>
                        <h3 className="text-xl font-bold text-heading mt-2">No saved items yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
                            Posts and questions you save will appear here.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
