"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { Loader2 } from "lucide-react";

import { ProfileHeader } from "./profile-header";
import { ProfileInfo } from "./profile-info";
import { ProfileTabs } from "./profile-tabs";
import { ProfileContent } from "./profile-content";

interface ProfileViewWrapperProps {
    profileId: string;
}

export function ProfileViewWrapper({ profileId }: ProfileViewWrapperProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "post" | "qa-post" | "saved">("overview");

    const { user } = useSelector((state: RootState) => state.auth);
    const isOwnProfile = user?.profileId === profileId;

    const { data: userProfile, isLoading: isProfileLoading } = useGetProfileById(profileId);

    if (isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 transition-opacity">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen pb-10 fade-in">
            <ProfileHeader
                profile={userProfile}
                isOwnProfile={isOwnProfile}
            />

            <ProfileInfo
                profile={userProfile}
            />

            <ProfileTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOwnProfile={isOwnProfile}
                isPrivate={userProfile.isPrivate}
            />

            <ProfileContent
                activeTab={activeTab}
                targetProfileId={profileId}
                isOwnProfile={isOwnProfile}
                isPrivate={userProfile.isPrivate}
                fullName={userProfile.fullName}
            />
        </div>
    );
}
