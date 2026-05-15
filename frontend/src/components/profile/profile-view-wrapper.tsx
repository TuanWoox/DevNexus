"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ProfileHeader } from "./profile-header";
import { ProfileInfo } from "./profile-info";
import { ProfileTabs } from "./profile-tabs";
import { ProfileContent } from "./profile-content";
import { EditProfileModal } from "./edit-profile-modal";

import { useHasMounted } from "@/hooks/use-has-mounted";
import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";

interface ProfileViewWrapperProps {
    profileId: string;
    currentProfileId?: string;
}

export function ProfileViewWrapper({ profileId, currentProfileId }: ProfileViewWrapperProps) {
    const hasMounted = useHasMounted();
    const [activeTab, setActiveTab] = useState<"overview" | "post" | "qa-post" | "saved">("overview");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data: profile } = useGetProfileById(profileId);
    const { user } = useSelector((state: RootState) => state.auth);

    if (!profile) return null;
    // Use currentProfileId from server to ensure consistent SSR and hydration.
    // Falls back to user?.profileId from Redux on the client if needed.
    const isOwnProfile = (currentProfileId || user?.profileId) === profile.id;

    return (
        <div className="flex flex-col w-full min-h-screen fade-in">
            <div className="bg-card shadow-card mb-2">
                {/* Full-width cover + avatar section */}
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                />

                {/* Constrained content area */}
                <ProfileInfo
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onEdit={() => setIsEditModalOpen(true)}
                />

                <ProfileTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOwnProfile={isOwnProfile}
                    isPrivate={profile.isPrivate}
                    canViewContent={profile.canViewProfile}
                />
            </div>

            <ProfileContent
                activeTab={activeTab}
                targetProfileId={profile.id}
                isOwnProfile={isOwnProfile}
                isPrivate={profile.isPrivate}
                canViewContent={profile.canViewProfile}
            />

            {isOwnProfile && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentProfile={profile}
                />
            )}
        </div>
    );
}



