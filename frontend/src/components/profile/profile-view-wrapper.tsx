"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ProfileHeader } from "./profile-header";
import { ProfileInfo } from "./profile-info";
import { ProfileTabs } from "./profile-tabs";
import { ProfileContent } from "./profile-content";

import { useHasMounted } from "@/hooks/use-has-mounted";
import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";

interface ProfileViewWrapperProps {
    profileId: string;
}

export function ProfileViewWrapper({ profileId }: ProfileViewWrapperProps) {
    const hasMounted = useHasMounted();
    const [activeTab, setActiveTab] = useState<"overview" | "post" | "qa-post" | "saved">("overview");

    const { data: profile } = useGetProfileById(profileId);
    const { user } = useSelector((state: RootState) => state.auth);

    if (!profile) return null;
    // Gate isOwnProfile with hasMounted to ensure server/client initial render match.
    // This prevents Radix ID shifts caused by conditional modal rendering.
    const isOwnProfile = hasMounted && user?.profileId === profile.id;

    return (
        <div className="flex flex-col w-full min-h-screen fade-in">
            <div className="bg-card shadow-card">
                {/* Full-width cover + avatar section */}
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                />

                {/* Constrained content area */}
                <ProfileInfo
                    profile={profile}
                />

                <ProfileTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOwnProfile={isOwnProfile}
                    isPrivate={profile.isPrivate}
                />
            </div>

            <ProfileContent
                activeTab={activeTab}
                targetProfileId={profile.id}
                isOwnProfile={isOwnProfile}
                isPrivate={profile.isPrivate}
            />
        </div>
    );
}
